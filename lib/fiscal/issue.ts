/**
 * Issue the TRA receipt for a sale, or the adjustment that cancels one, when
 * the shop has TRA receipts switched on. Called right after a sale is saved
 * (lib/local/sale.ts) and when one is voided (lib/local/actions.ts).
 *
 * Never blocks or loses the sale: if anything here fails, the sale is already
 * saved and a 'failed' receipt records why.
 */
import { businessDay, nowIso } from '../date';
import { db } from '../local/db';
import { persist } from '../local/write';
import { shopHasFeature } from '../shop-config';
import type { Business, FiscalReceipt } from '../types';
import { uuidv7 } from '../uuid';
import { demoConnector, liveQueueConnector, type FiscalConnector } from './connector';
import { fiscalTotals } from './tra';

export function connectorFor(business: Pick<Business, 'settings'>): FiscalConnector {
  return business.settings?.fiscal?.mode === 'live' ? liveQueueConnector : demoConnector;
}

/** The latest counters this phone knows for the shop, in this mode. */
async function lastCounters(businessId: string, mode: 'demo' | 'live') {
  const rows = await db()
    .fiscalReceipts.where('businessId')
    .equals(businessId)
    .filter((r) => r.mode === mode && r.gc != null)
    .toArray();
  const last = rows.reduce<FiscalReceipt | null>((best, r) => (!best || (r.gc ?? 0) > (best.gc ?? 0) ? r : best), null);
  return last && last.gc != null && last.dc != null && last.znum ? { gc: last.gc, dc: last.dc, znum: last.znum } : null;
}

export async function issueFiscalReceipt(
  saleId: string,
  kind: 'sale' | 'adjustment' = 'sale',
  actor: { userId?: string | null; at?: string } = {}
): Promise<FiscalReceipt | null> {
  const database = db();
  const sale = await database.sales.get(saleId);
  if (!sale) return null;
  const business = await database.businesses.get(sale.businessId);
  if (!business || !shopHasFeature(business, 'traReceipts')) return null;

  const existing = await database.fiscalReceipts.where('saleId').equals(saleId).filter((r) => r.kind === kind).first();
  if (existing) return existing;
  // An adjustment cancels a receipt; with no receipt there is nothing to cancel.
  if (kind === 'adjustment') {
    const original = await database.fiscalReceipts.where('saleId').equals(saleId).filter((r) => r.kind === 'sale').first();
    if (!original || original.status !== 'issued') return null;
  }

  const lines = await database.saleLines.where('saleId').equals(saleId).toArray();
  const vatRate = typeof business.settings?.vatRate === 'number' ? business.settings.vatRate : 18;
  const sign = kind === 'adjustment' ? -1 : 1;
  const totals = fiscalTotals({
    lines: lines.map((l) => ({ id: l.id, description: l.description ?? '', qty: l.qty, amountInclusive: l.lineTotal, vatType: l.vatType })),
    discount: sale.discount,
    vatRate,
  });
  // A discount comes off the whole sale, so VAT and the net amount shrink in proportion.
  const paid = totals.inclusive - totals.discount;
  const share = totals.inclusive > 0 ? paid / totals.inclusive : 1;
  const vat = Math.round(totals.vat.reduce((sum, v) => sum + v.tax, 0) * share);

  const connector = connectorFor(business);
  const at = actor.at ?? nowIso();
  const issuedAt = new Date(at);
  let result;
  try {
    result = await connector.issue(
      { businessId: sale.businessId, businessDay: businessDay(at), issuedAt },
      await lastCounters(sale.businessId, connector.mode)
    );
  } catch (error) {
    result = {
      status: 'failed' as const,
      counters: null,
      rctvNum: null,
      verifyUrl: null,
      provider: connector.mode,
      ackCode: null,
      ackMessage: error instanceof Error ? error.message : 'unknown',
    };
  }

  const receipt: FiscalReceipt = {
    id: uuidv7(),
    businessId: sale.businessId,
    saleId,
    kind,
    mode: connector.mode,
    status: result.status,
    gc: result.counters?.gc ?? null,
    dc: result.counters?.dc ?? null,
    znum: result.counters?.znum ?? null,
    rctvNum: result.rctvNum,
    verifyUrl: result.verifyUrl,
    totalInclusive: sign * paid,
    totalExclusive: sign * (paid - vat),
    vat: sign * vat,
    provider: result.provider,
    ackCode: result.ackCode,
    ackMessage: result.ackMessage,
    issuedAt: result.status === 'issued' ? at : null,
    createdBy: actor.userId ?? null,
    clientCreatedAt: at,
    createdAt: at,
  };
  await persist('fiscalReceipts', receipt);
  return receipt;
}
