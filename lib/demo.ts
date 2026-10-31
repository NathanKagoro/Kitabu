import { summariseDay } from './calc/summary';
import {
  closeDay,
  createCustomer,
  recordDebtPayment,
  recordExpense,
  recordOpeningStock,
  recordPurchase,
  recordSale,
  recordWaste,
  recordWithdrawal,
  saveProduct,
  saveProductPacks,
} from './local/actions';
import { recordStockCount } from './local/stock-count';
import { packToUnits } from './calc/packs';
import { stockByProduct } from './calc/stock';
import { addDays, businessDay, dayBounds } from './date';
import { db } from './local/db';
import { loadRange } from './local/queries';
import { createBusiness } from './onboarding/create-business';
import { STARTER_PRODUCTS, type StarterProduct } from './onboarding/starter-products';
import { productLabel } from './products';
import type { BusinessType, ExpenseCategory, Member, Product, SpendMethod } from './types';
import { nowIso } from './date';
import { persist } from './local/write';
import { uuidv7 } from './uuid';

/**
 * Two weeks of a plausible shop of the same kind as the one being shown -- a
 * cosmetics shop gets lotions and lipsticks, a hardware shop cement and nails
 * -- recorded through the same domain actions the app itself uses, so a
 * number that looks wrong in a demo is a real bug.
 *
 * It ends with what a visit is about: a stock check a week ago that was
 * nearly clean, and one today with things missing, so the stock report has
 * something to show. Seeded with a fixed PRNG so every demo looks the same.
 */

const CUSTOMERS = [
  { name: 'Mama Asha', phone: '0713 222 111' },
  { name: 'Baba Juma', phone: '0754 333 444' },
  { name: 'Bi. Rehema', phone: '0689 555 666' },
  { name: 'Neema Mushi', phone: '0765 777 888' },
  { name: 'Mzee Hamisi', phone: null },
];

/** How many items a typical sale has, and how many sales a day, by trade. */
const PACE: Partial<Record<BusinessType, { perDay: [number, number]; restock: [number, number] }>> = {
  genge: { perDay: [18, 33], restock: [8, 14] },
  duka: { perDay: [20, 35], restock: [10, 20] },
  cosmetics: { perDay: [6, 12], restock: [3, 6] },
  clothes: { perDay: [4, 9], restock: [2, 4] },
  hardware: { perDay: [6, 12], restock: [3, 6] },
  pharmacy: { perDay: [12, 22], restock: [5, 10] },
  wholesale: { perDay: [4, 8], restock: [3, 6] },
};

function prng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const keyOf = (p: Pick<Product, 'name' | 'variant'>) => `${p.name}|${p.variant ?? ''}`;

export async function createDemoBusiness(
  userId: string,
  name: string,
  locale: string,
  type: BusinessType = 'genge',
  /** The demo link names the owner and adds staff, so "sales by staff" has people in it. */
  people: { owner?: string; staff?: readonly { name: string; role: 'manager' | 'cashier' }[] } = {}
): Promise<string> {
  const business = await createBusiness({ name, type, locale, userId });
  const businessId = business.id;
  const owner = (await db().members.where('businessId').equals(businessId).first())!;
  if (people.owner) await persist('members', { ...owner, name: people.owner, updatedAt: nowIso() });
  const sellers: (string | null)[] = [owner.id];
  for (const person of people.staff ?? []) {
    const at = nowIso();
    const id = uuidv7();
    await persist('members', {
      id, businessId, userId: null, name: person.name, phone: null, role: person.role,
      pinHash: null, active: true, createdAt: at, updatedAt: at, deletedAt: null,
    } satisfies Member);
    sellers.push(id, id); // staff do most of the selling
  }
  const random = prng(42);
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
  const between = ([lo, hi]: [number, number]) => lo + Math.floor(random() * (hi - lo + 1));
  const pace = PACE[type] ?? { perDay: [8, 16], restock: [4, 8] };

  const starters = new Map<string, StarterProduct>(STARTER_PRODUCTS[type].map((s) => [keyOf(s), s]));
  const products = await db().products.where('businessId').equals(businessId).toArray();
  const priced: (Product & { starter: StarterProduct | undefined })[] = [];
  for (const product of products) {
    const starter = starters.get(keyOf(product));
    const next = { ...product, price: starter?.price ?? 1000, trackStock: true, lowStockLevel: 3 };
    await saveProduct(next);
    if (starter?.pack) await saveProductPacks({ businessId, productId: product.id, packs: [starter.pack] });
    priced.push({ ...next, starter });
  }

  const customers = [];
  // Most demo customers agreed to offers at the till; a few did not.
  for (const [i, c] of CUSTOMERS.entries()) {
    customers.push(await createCustomer({ businessId, name: c.name, phone: c.phone, offersConsent: i % 3 !== 2 }));
  }

  const today = businessDay();
  const at = (day: string, hour: number) =>
    new Date(Math.min(new Date(dayBounds(day).start).getTime() + hour * 3_600_000, Date.now() - 60_000)).toISOString();
  const onHand = async () => stockByProduct(await db().stockMovements.where('businessId').equals(businessId).toArray());

  // The float in the tin on the first morning; every close carries forward.
  const FLOAT = 50000;
  let openingCash = FLOAT;
  // Cash in the tin as the day goes, so the demo never pays from money it lacks.
  let tin = openingCash;
  /** Pay from the tin when it can; otherwise mobile money or the owner's pocket, as real shops do. */
  const payFrom = (amount: number): SpendMethod => {
    if (tin >= amount && random() < 0.6) {
      tin -= amount;
      return 'cash';
    }
    return random() < 0.6 ? 'mpesa' : 'owner';
  };

  const costOf = (p: (typeof priced)[number]) => p.starter?.cost ?? Math.round(p.price * 0.7);

  // The shelf as it stood when the shop started using Kitabu: opening stock at
  // cost, not a purchase -- no money left the tin to buy it.
  await recordOpeningStock({
    businessId,
    userId,
    at: at(addDays(today, -13), 6),
    lines: priced.map((p) => ({
      productId: p.id,
      qty: p.starter?.pack ? packToUnits(1, p.starter.pack.units) : between(pace.restock) * 5,
      unitCost: costOf(p),
    })),
  });

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const day = addDays(today, -daysAgo);
    tin = openingCash;

    // Restock a few lines most mornings.
    const restock = priced.filter((_, index) => index % 3 === daysAgo % 3).slice(0, 3);
    const lines = await Promise.all(
      restock.map(async (p) => {
        const cost = costOf(p);
        const bulk = p.starter?.pack;
        if (!bulk) {
          const qty = between(pace.restock);
          return { productId: p.id, qty, totalCost: qty * cost };
        }
        const packQty = random() < 0.6 ? 0.5 : 1;
        const qty = packToUnits(packQty, bulk.units);
        const pack = await db().productPacks.where('productId').equals(p.id).filter((row) => row.active).first();
        return { productId: p.id, qty, totalCost: Math.round(qty * cost), packId: pack?.id ?? null, packLabel: bulk.label, packQty };
      })
    );
    const restockTotal = lines.reduce((sum, l) => sum + l.totalCost, 0);
    await recordPurchase({ businessId, userId, at: at(day, 7), lines, method: payFrom(restockTotal) });

    await recordExpense({ businessId, userId, at: at(day, 7.5), category: 'nauli', amount: 3000, method: payFrom(3000) });
    if (daysAgo % 7 === 0) {
      await recordExpense({ businessId, userId, at: at(day, 12), category: 'kodi' as ExpenseCategory, amount: 15000, method: payFrom(15000) });
    }

    const salesToday = between(pace.perDay);
    for (let i = 0; i < salesToday; i++) {
      const hour = 8 + (i / salesToday) * 11;
      const items = 1 + Math.floor(random() * 2);
      const lines = Array.from({ length: items }, () => {
        const p = pick(priced);
        return {
          id: crypto.randomUUID(),
          productId: p.id,
          description: productLabel(p),
          qty: 1 + (random() < 0.25 ? 1 : 0),
          unitPrice: p.price,
          unitCost: p.starter?.cost ?? null,
          vatType: p.vatType,
        };
      });
      const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
      const roll = random();
      const onCredit = roll < 0.08;
      const named = onCredit || roll > 0.8;
      await recordSale({
        businessId,
        userId,
        at: at(day, hour),
        lines,
        memberId: people.staff?.length ? pick(sellers) : null,
        customerId: named ? pick(customers).id : null,
        tenders: onCredit ? [] : roll < 0.4 ? [{ method: 'mpesa', amount: total }] : [{ method: 'cash', amount: total }],
      });
    }

    if (daysAgo % 5 === 1) {
      await recordWaste({ businessId, userId, at: at(day, 18), productId: priced[0]!.id, qty: 1, reason: type === 'genge' ? 'imeoza' : 'imeharibika' });
    }
    if (daysAgo % 4 === 2) {
      await recordDebtPayment({ businessId, userId, at: at(day, 17), customerId: pick(customers).id, amount: 2000, method: 'cash' });
    }

    // Stock checks: a week ago nearly clean, today a few things missing.
    if (daysAgo === 7 || daysAgo === 0) {
      const stock = await onHand();
      const shelf = priced.slice(0, Math.min(priced.length, 8));
      await recordStockCount({
        businessId,
        userId,
        kind: 'check',
        at: at(day, 19),
        items: shelf.map((p, index) => {
          const recorded = Math.max(0, stock.get(p.id) ?? 0);
          const missing = daysAgo === 7 ? (index === 0 ? 1 : 0) : index % 3 === 0 ? 2 : index % 4 === 1 ? 1 : 0;
          return { productId: p.id, counted: Math.max(0, recorded - missing) };
        }),
      });
    }

    // Funga siku for every finished day, usually a few hundred shillings out.
    if (daysAgo > 0) {
      // Evening: the owner takes something for home now and then, and banks
      // the takings above the float every few days.
      const before = summariseDay({ ...(await loadRange(businessId, day, day)), openingCash });
      if (daysAgo % 5 === 0 && before.expectedCash > FLOAT) {
        await recordWithdrawal({ businessId, userId, at: at(day, 18.5), amount: 10000, purpose: 'personal' });
      }
      const afterPersonal = summariseDay({ ...(await loadRange(businessId, day, day)), openingCash });
      if (daysAgo % 2 === 1 && afterPersonal.expectedCash > FLOAT * 2) {
        const bank = Math.floor((afterPersonal.expectedCash - FLOAT) / 10000) * 10000;
        await recordWithdrawal({ businessId, userId, at: at(day, 18.75), amount: bank, purpose: 'bank' });
      }
      const summary = summariseDay({ ...(await loadRange(businessId, day, day)), openingCash });
      const shortBy = random() < 0.6 ? 0 : Math.round(random() * 10) * 100;
      const counted = Math.max(0, summary.expectedCash - shortBy);
      await closeDay({ businessId, userId, day, openingCash, expectedCash: summary.expectedCash, countedCash: counted });
      openingCash = counted;
    }
  }

  return businessId;
}
