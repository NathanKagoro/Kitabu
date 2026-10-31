/**
 * "Where the profit goes": the owner shares profit out by percentages (tithe,
 * reinvesting, personal use, savings...). Came from Daftari; pure and tested
 * (tests/unit/daftari-maths.test.ts).
 */

export interface SplitBucket {
  id: string;
  /** One of the built-in buckets (worded by the app), or absent for the owner's own. */
  key?: 'tithe' | 'reinvest' | 'personal' | 'savings';
  /** The owner's own name for a bucket they added. */
  label?: string;
  pct: number;
}

export const DEFAULT_SPLIT: readonly SplitBucket[] = [
  { id: 'tithe', key: 'tithe', pct: 10 },
  { id: 'reinvest', key: 'reinvest', pct: 35 },
  { id: 'personal', key: 'personal', pct: 30 },
  { id: 'savings', key: 'savings', pct: 25 },
];

export type SplitProblem = 'total' | 'names' | 'negative';

/** What's wrong with a split, if anything: percentages must add to 100, every bucket named. */
export function checkSplit(buckets: readonly SplitBucket[]): SplitProblem | null {
  if (buckets.some((b) => !Number.isFinite(b.pct) || b.pct < 0)) return 'negative';
  if (buckets.some((b) => !b.key && !b.label?.trim())) return 'names';
  const total = buckets.reduce((sum, b) => sum + b.pct, 0);
  return Math.abs(total - 100) < 0.001 ? null : 'total';
}

/**
 * Profit shared by the percentages, in whole shillings that add up to the
 * profit exactly. No profit (or a loss) means nothing to share: [].
 */
export function splitProfit(profit: number, buckets: readonly SplitBucket[]): { id: string; amount: number }[] {
  const amount = Math.round(profit);
  if (amount <= 0 || buckets.length === 0) return [];
  const total = buckets.reduce((sum, b) => sum + Math.max(0, b.pct), 0);
  if (total <= 0) return [];
  const exact = buckets.map((b) => (amount * Math.max(0, b.pct)) / total);
  const shares = exact.map(Math.floor);
  let left = amount - shares.reduce((a, b) => a + b, 0);
  const order = exact.map((v, i) => ({ i, rest: v - Math.floor(v) })).sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    shares[i]! += 1;
    left -= 1;
  }
  return buckets.map((b, i) => ({ id: b.id, amount: shares[i]! }));
}

/** The owner's saved split, or the default when none (or a broken one) is saved. */
export function splitOf(saved: unknown): SplitBucket[] {
  if (!Array.isArray(saved)) return DEFAULT_SPLIT.map((b) => ({ ...b }));
  const buckets = saved.filter(
    (b): b is SplitBucket => !!b && typeof b === 'object' && typeof (b as SplitBucket).id === 'string' && typeof (b as SplitBucket).pct === 'number'
  );
  return buckets.length && checkSplit(buckets) === null ? buckets : DEFAULT_SPLIT.map((b) => ({ ...b }));
}
