/**
 * The figures on Kitabu's business dashboard that are not already a day
 * summary: how a period compares with the one before, the margin, the average
 * sale, how the money came in, and which stock needs buying.
 */
import type { DaySummary } from './summary';
import { isLowStock } from './stock';

/** Percentage change from `previous` to `current`, whole numbers; null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Profit as a share of sales, whole percent; null with no sales. */
export function marginPercent(profit: number, sales: number): number | null {
  if (sales <= 0) return null;
  return Math.round((profit / sales) * 100);
}

/** The average sale, rounded to the shilling; 0 with no sales. */
export function averageSale(total: number, count: number): number {
  return count > 0 ? Math.round(total / count) : 0;
}

export interface MixPart {
  key: 'cash' | 'mobile' | 'credit';
  amount: number;
  /** Whole percent of the sales total; the parts add up to 100 when there are sales. */
  pct: number;
}

/** How the period's sales were paid: cash, mobile money or bank, and on credit. */
export function paymentMix(summary: Pick<DaySummary, 'cash' | 'mobile' | 'bank' | 'credit'>): MixPart[] {
  const parts: Omit<MixPart, 'pct'>[] = [
    { key: 'cash', amount: summary.cash },
    { key: 'mobile', amount: summary.mobile + summary.bank },
    { key: 'credit', amount: summary.credit },
  ];
  const total = parts.reduce((sum, p) => sum + p.amount, 0);
  if (total <= 0) return parts.map((p) => ({ ...p, pct: 0 }));
  const pcts = parts.map((p) => Math.floor((p.amount / total) * 100));
  // Hand the rounding leftovers to the largest shares so the bar fills exactly.
  let left = 100 - pcts.reduce((a, b) => a + b, 0);
  const order = parts.map((p, i) => ({ i, rest: (p.amount / total) * 100 - pcts[i]! })).sort((a, b) => b.rest - a.rest);
  for (const { i } of order) {
    if (left <= 0) break;
    pcts[i]! += 1;
    left--;
  }
  return parts.map((p, i) => ({ ...p, pct: pcts[i]! }));
}

export interface StockAlert<P> {
  product: P;
  onHand: number;
  status: 'out' | 'low';
}

/** Tracked products that have run out or fallen to their reorder level: out first, then the lowest. */
export function stockAlerts<P extends { id: string; trackStock: boolean; active: boolean; lowStockLevel?: number | null }>(
  products: readonly P[],
  stock: ReadonlyMap<string, number>
): StockAlert<P>[] {
  const alerts: StockAlert<P>[] = [];
  for (const product of products) {
    if (!product.trackStock || !product.active) continue;
    const onHand = stock.get(product.id) ?? 0;
    if (onHand <= 0) alerts.push({ product, onHand, status: 'out' });
    else if (isLowStock(onHand, product.lowStockLevel)) alerts.push({ product, onHand, status: 'low' });
  }
  return alerts.sort((a, b) => (a.status === b.status ? a.onHand - b.onHand : a.status === 'out' ? -1 : 1));
}

/**
 * What the stock on the shelves cost: each product's quantity on hand at its
 * average buying cost. Products with no known cost are counted separately so
 * the screen can say the figure leaves them out; nothing below zero counts.
 */
export function inventoryValue(items: readonly { onHand: number; unitCost: number | null }[]): { value: number; uncosted: number } {
  let value = 0;
  let uncosted = 0;
  for (const item of items) {
    if (item.onHand <= 0) continue;
    if (item.unitCost == null || item.unitCost <= 0) uncosted++;
    else value += Math.round(item.onHand * item.unitCost);
  }
  return { value, uncosted };
}
