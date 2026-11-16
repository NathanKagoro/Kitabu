import { balancesByCustomer } from './calc/credit';
import { priceFor } from './calc/pricing';
import { summariseDay } from './calc/summary';
import {
  closeDay,
  createCustomer,
  createSupplier,
  recordDebtPayment,
  recordExpense,
  recordOpeningStock,
  recordPurchase,
  recordSupplierPayment,
  recordSale,
  recordWaste,
  recordWithdrawal,
  saveProduct,
  saveProductPacks,
} from './local/actions';
import { recordStockCount } from './local/stock-count';
import { stockByProduct } from './calc/stock';
import { addDays, businessDay, dayBounds } from './date';
import { db } from './local/db';
import { loadRange } from './local/queries';
import { createBusiness } from './onboarding/create-business';
import {
  DEMO_CUSTOMERS,
  DEMO_SUPPLIERS,
  EXPENSE_CATEGORY,
  EXPENSES,
  EXTRA_PRODUCTS,
  STARTER_WEIGHT,
  WEEKDAY_PACE,
  type DemoProduct,
} from './demo-catalogue';
import { STARTER_PRODUCTS } from './onboarding/starter-products';
import { productLabel } from './products';
import type { BusinessType, Member, PaymentMethod, Product, SpendMethod } from './types';
import { nowIso } from './date';
import { persist } from './local/write';
import { uuidv7 } from './uuid';

/**
 * Five weeks of a plausible shop of the same kind as the one being shown -- a
 * clothes shop gets vitenge and jeans, a hardware shop cement and nails --
 * recorded through the same domain actions the app itself uses, so a number
 * that looks wrong in a demo is a real bug.
 *
 * The trading has a rhythm: busier on Friday and Saturday, quiet on Sunday,
 * a lift at the end of the month and slow growth over the five weeks. Best
 * sellers sell more often (lib/demo-catalogue.ts weights), stock is bought
 * from named suppliers when it runs low (sometimes on their credit), a few
 * lines are left to run low or out, and the running costs come round when
 * they would: rent on the 1st, power and the guard weekly, lunch most days,
 * wages at month end. Today holds only the sales up to the current hour.
 *
 * It ends with what a visit is about: a stock check a week ago that was
 * nearly clean, and one today with things missing, so the stock report has
 * something to show. Seeded with a fixed PRNG so every demo looks the same.
 */

const DAYS = 35;

/** How many sales a day, how many bags or cartons a shop buys at a time, and how much goes on credit, by trade. */
const PACE: Partial<Record<BusinessType, { perDay: [number, number]; credit?: number; bulk?: number }>> = {
  genge: { perDay: [18, 30] },
  duka: { perDay: [16, 24] },
  cosmetics: { perDay: [7, 12] },
  clothes: { perDay: [5, 10], credit: 0.06 },
  hardware: { perDay: [9, 15], credit: 0.1 },
  pharmacy: { perDay: [12, 22] },
  // Shops buy several bags and cartons at a time, and many on account.
  wholesale: { perDay: [8, 13], credit: 0.15, bulk: 6 },
};

/** The smallest repayment a customer makes: a shop settling with its wholesaler pays far more than a neighbour at a duka. */
const DEBT_INSTALMENT: Partial<Record<BusinessType, number>> = { wholesale: 150000, hardware: 50000, clothes: 15000 };

const BULK_PRICE: Partial<Record<BusinessType, { off: number; from: number }>> = {
  hardware: { off: 0.04, from: 10 },
  wholesale: { off: 0.03, from: 5 },
};

/** Shops whose suppliers give them time to pay. */
const SUPPLIER_CREDIT: Partial<Record<BusinessType, number>> = { hardware: 0.3, wholesale: 0.35, clothes: 0.2 };

function prng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const keyOf = (p: Pick<Product, 'name' | 'variant'>) => `${p.name}|${p.variant ?? ''}`;

/** The hour of the day in Dar es Salaam, as a fraction (13.5 = half past one). */
function darHour(): number {
  const now = new Date(Date.now() + 3 * 3_600_000);
  return now.getUTCHours() + now.getUTCMinutes() / 60;
}

export async function createDemoBusiness(
  userId: string,
  name: string,
  locale: string,
  type: BusinessType = 'genge',
  /** The demo link names the owner and adds staff, so "sales by staff" has people in it. */
  people: { owner?: string; staff?: readonly { name: string; role: 'manager' | 'cashier' }[] } = {}
): Promise<string> {
  const catalogue: readonly DemoProduct[] = [...STARTER_PRODUCTS[type], ...(EXTRA_PRODUCTS[type] ?? [])];
  const business = await createBusiness({ name, type, locale, userId, starter: catalogue });
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
  const pace = PACE[type] ?? { perDay: [8, 16] };
  const plan = EXPENSES[type] ?? EXPENSES.default;

  const byKey = new Map<string, DemoProduct>(catalogue.map((s) => [keyOf(s), s]));
  const products = await db().products.where('businessId').equals(businessId).toArray();
  type Priced = Product & { demo: DemoProduct | undefined; w: number; qty: [number, number] };
  const priced: Priced[] = [];
  for (const product of products) {
    const demo = byKey.get(keyOf(product));
    const price = demo?.price ?? 1000;
    // Hardware and wholesale shops give a bulk price: 4% off from 10 pieces, 3% off from 5 bags or cartons.
    const bulk = BULK_PRICE[type];
    const next = {
      ...product,
      price,
      trackStock: true,
      lowStockLevel: product.unit === 'kipande' || product.unit === 'custom' ? 5 : 10,
      // Packaged goods carry barcodes, so the till's camera scan has something to find.
      barcode: product.barcode ?? `620${String(priced.length + 1).padStart(10, '0')}`,
      ...(bulk ? { wholesalePrice: Math.round((price * (1 - bulk.off)) / 100) * 100, wholesaleMinQty: bulk.from } : {}),
    };
    await saveProduct(next);
    if (demo?.pack) await saveProductPacks({ businessId, productId: product.id, packs: [demo.pack] });
    const w = demo?.w ?? STARTER_WEIGHT[type]?.[product.name] ?? 1;
    const qty: [number, number] =
      demo?.qty ?? (product.unit === 'kg' || product.unit === 'lita' ? [1, 3] : product.unit === 'custom' && product.unitLabel === 'mita' ? [5, 25] : [1, 2]);
    priced.push({ ...next, demo, w, qty });
  }
  const totalWeight = priced.reduce((sum, p) => sum + p.w, 0);
  /** A product, the popular ones more often. */
  const pickProduct = (): Priced => {
    let roll = random() * totalWeight;
    for (const p of priced) {
      roll -= p.w;
      if (roll <= 0) return p;
    }
    return priced[priced.length - 1]!;
  };
  // Two ordinary lines the shop forgot to reorder: one runs out, one runs low by today.
  const forgotten = new Set(priced.filter((p) => p.w === 1).slice(1, 3).map((p) => p.id));

  const customers: Awaited<ReturnType<typeof createCustomer>>[] = [];
  // Most demo customers agreed to offers at the till; a few did not.
  for (const [i, c] of (DEMO_CUSTOMERS[type] ?? DEMO_CUSTOMERS.default).entries()) {
    customers.push(await createCustomer({ businessId, name: c.name, phone: c.phone, offersConsent: i % 3 !== 2 }));
  }
  /** Regulars come back more often than the rest. */
  const pickCustomer = () => customers[Math.floor(customers.length * random() * random())]!;

  const suppliers: Awaited<ReturnType<typeof createSupplier>>[] = [];
  for (const sup of DEMO_SUPPLIERS[type] ?? DEMO_SUPPLIERS.default) {
    suppliers.push(await createSupplier({ businessId, userId, name: sup.name, phone: sup.phone }));
  }
  // Each category comes from one supplier, as it does in real life.
  const categories = [...new Set(priced.map((p) => p.category ?? ''))];
  const supplierFor = (p: Priced) => suppliers[Math.max(0, categories.indexOf(p.category ?? '')) % suppliers.length]!;

  const today = businessDay();
  const nowHour = darHour();
  const at = (day: string, hour: number) =>
    new Date(Math.min(new Date(dayBounds(day).start).getTime() + hour * 3_600_000, Date.now() - 60_000)).toISOString();
  const onHand = async () => stockByProduct(await db().stockMovements.where('businessId').equals(businessId).toArray());
  const target = (p: Priced) => Math.ceil(p.w * (p.unit === 'kg' || p.unit === 'lita' ? 40 : p.qty[1] > 5 ? 60 : 14) + 6);

  // The float in the tin on the first morning; every close carries forward.
  const FLOAT = type === 'wholesale' || type === 'hardware' ? 100000 : 50000;
  let openingCash = FLOAT;
  // Cash in the tin as the day goes, so the demo never pays from money it lacks.
  let tin = openingCash;
  /** Pay from the tin when it can; otherwise mobile money, the bank or the owner's pocket, as real shops do. */
  const payFrom = (amount: number): SpendMethod => {
    if (tin >= amount && random() < 0.6) {
      tin -= amount;
      return 'cash';
    }
    return amount > 200000 ? 'bank' : random() < 0.6 ? 'mpesa' : 'owner';
  };
  const costOf = (p: Priced) => p.demo?.cost ?? Math.round(p.price * 0.7);

  // The shelf as it stood when the shop started using Kitabu: opening stock at
  // cost, not a purchase -- no money left the tin to buy it.
  await recordOpeningStock({
    businessId,
    userId,
    at: at(addDays(today, -(DAYS - 1)), 6),
    lines: priced.map((p) => ({ productId: p.id, qty: forgotten.has(p.id) ? Math.ceil(p.qty[1] * 4) : target(p), unitCost: costOf(p) })),
  });

  for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo--) {
    const day = addDays(today, -daysAgo);
    const date = new Date(`${day}T12:00:00Z`);
    const weekday = (date.getUTCDay() + 6) % 7; // Monday 0
    const dom = date.getUTCDate();
    const lastOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate() === dom;
    tin = openingCash;

    // Morning: buy what is running low, from each line's supplier.
    const stock = await onHand();
    const due = priced.filter((p) => !forgotten.has(p.id) && (stock.get(p.id) ?? 0) < target(p) * 0.4);
    const bySupplier = new Map<string, Priced[]>();
    for (const p of due) bySupplier.set(supplierFor(p).id, [...(bySupplier.get(supplierFor(p).id) ?? []), p]);
    for (const [supplierId, list] of [...bySupplier].slice(0, 2)) {
      const lines = list.slice(0, 6).map((p) => {
        const qty = Math.max(1, target(p) - Math.max(0, stock.get(p.id) ?? 0));
        return { productId: p.id, qty, totalCost: Math.round(qty * costOf(p)) };
      });
      // The boda or the pickup to the supplier and back: part of what the goods cost.
      const transport = type === 'hardware' || type === 'wholesale' ? 15000 : 4000;
      const total = lines.reduce((sum, l) => sum + l.totalCost, 0) + transport;
      const onAccount = random() < (SUPPLIER_CREDIT[type] ?? 0);
      await recordPurchase({
        businessId,
        userId,
        at: at(day, 7),
        supplierId,
        lines,
        transport,
        paidAmount: onAccount ? Math.round(total / 2 / 1000) * 1000 : total,
        method: payFrom(onAccount ? total / 2 : total),
      });
    }

    // Running costs, when they come round.
    const spend = async (key: keyof typeof EXPENSE_CATEGORY, amount: number, hour: number, method?: SpendMethod) => {
      if (amount > 0) await recordExpense({ businessId, userId, at: at(day, hour), category: EXPENSE_CATEGORY[key], amount, method: method ?? payFrom(amount) });
    };
    if (dom === 1) await spend('rent', plan.rent, 9, 'bank');
    if (dom === 15) await spend('levy', plan.levy, 10);
    if (weekday === 0) await spend('power', plan.power, 9, 'mpesa');
    if (weekday === 5) await spend('guard', plan.guard, 18);
    if (random() < 0.85) await spend('lunch', plan.lunch, 13);
    if (random() < 0.3) await spend('transport', plan.transport, 11);
    if (lastOfMonth && people.staff?.length) await spend('wage', plan.wage * people.staff.length, 17, 'bank');

    // The day's selling: weekday rhythm, month-end lift, slow growth; today only up to now.
    const growth = 1 + (DAYS - 1 - daysAgo) * 0.006;
    let salesToday = Math.round(between(pace.perDay) * WEEKDAY_PACE[weekday]! * growth * (dom >= 25 ? 1.1 : 1));
    const closeHour = daysAgo === 0 ? Math.min(19, Math.max(8.5, nowHour - 0.1)) : 19;
    if (daysAgo === 0) salesToday = Math.max(2, Math.round((salesToday * (closeHour - 8)) / 11));
    for (let i = 0; i < salesToday; i++) {
      const hour = 8 + ((i + random() * 0.8) / salesToday) * (closeHour - 8);
      const size = random();
      const items = type === 'clothes' ? (size < 0.7 ? 1 : 2) : size < 0.55 ? 1 : size < 0.83 ? 2 : size < 0.95 ? 3 : 4;
      const chosen = new Map<string, Priced>();
      for (let k = 0; k < items; k++) {
        const p = pickProduct();
        chosen.set(p.id, p);
      }
      const lines = [...chosen.values()].map((p) => {
        const qty = between(p.qty) + (pace.bulk ? Math.floor(random() * pace.bulk) : 0);
        return {
          id: crypto.randomUUID(),
          productId: p.id,
          description: productLabel(p),
          qty,
          unitPrice: priceFor(p, qty),
          unitCost: p.demo?.cost ?? null,
          vatType: p.vatType,
        };
      });
      const gross = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
      // Big orders are haggled down to a round figure now and then.
      const step = gross >= 300000 ? 10000 : 5000;
      const discount = gross >= 50000 && random() < 0.25 ? gross % step || step / 5 : 0;
      const total = gross - discount;
      const roll = random();
      const onCredit = roll < (pace.credit ?? 0.08);
      const named = onCredit || random() < 0.22;
      const method: PaymentMethod =
        total > 300000 && random() < 0.5 ? 'bank' : roll < 0.55 ? 'cash' : roll < 0.8 ? 'mpesa' : roll < 0.9 ? 'mixx' : 'airtel';
      const split = !onCredit && method !== 'cash' && total >= 20000 && random() < 0.15;
      const cashPart = Math.round(total / 2 / 1000) * 1000;
      await recordSale({
        businessId,
        userId,
        at: at(day, hour),
        lines,
        discount,
        memberId: people.staff?.length ? pick(sellers) : null,
        customerId: named ? pickCustomer().id : null,
        tenders: onCredit
          ? []
          : split
            ? [{ method: 'cash', amount: cashPart }, { method, amount: total - cashPart }]
            : [{ method, amount: total }],
      });
    }

    // A breakage now and then: a dented sheet, a split bag, a cracked tin.
    if (random() < 0.18) {
      const p = pickProduct();
      await recordWaste({ businessId, userId, at: at(day, 18), productId: p.id, qty: 1, reason: type === 'genge' ? 'imeoza' : 'imeharibika' });
    }
    // Customers come back to pay off what they owe: most settle within a week or two.
    for (let visit = 0; visit < 2; visit++) {
      if (random() > 0.6) continue;
      const balances = balancesByCustomer(await db().payments.where('businessId').equals(businessId).toArray());
      const owing = [...balances].filter(([, balance]) => balance > 0);
      if (owing.length) {
        const [customerId, balance] = pick(owing);
        const part = random() < 0.5 ? balance : balance * (0.3 + random() * 0.5);
        const amount = Math.min(balance, Math.max(DEBT_INSTALMENT[type] ?? 5000, Math.round(part / 1000) * 1000));
        await recordDebtPayment({ businessId, userId, at: at(day, Math.min(closeHour, 17)), customerId, amount, method: random() < 0.6 ? 'cash' : 'mpesa' });
      }
    }

    // Stock checks: a week ago nearly clean, today a few things missing.
    if (daysAgo === 7 || daysAgo === 0) {
      const counted = await onHand();
      const shelf = priced.filter((p) => !forgotten.has(p.id)).slice(0, 10);
      await recordStockCount({
        businessId,
        userId,
        kind: 'check',
        at: at(day, daysAgo === 0 ? Math.min(closeHour, 19) : 19),
        items: shelf.map((p, index) => {
          const recorded = Math.max(0, counted.get(p.id) ?? 0);
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
        await recordWithdrawal({ businessId, userId, at: at(day, 18.5), amount: Math.round(FLOAT / 5), purpose: 'personal' });
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

  // Settle part of what the shop owes its biggest supplier, as it would this week.
  if (SUPPLIER_CREDIT[type] && suppliers[0]) {
    await recordSupplierPayment({ businessId, userId, supplierId: suppliers[0].id, amount: type === 'wholesale' ? 500000 : 200000, method: 'bank' });
  }

  return businessId;
}
