import { describe, expect, it } from 'vitest';

import { averageSale, inventoryValue, marginPercent, paymentMix, percentChange, stockAlerts } from '@/lib/calc/dashboard';
import { previousRange } from '@/lib/calc/periods';

describe('the business dashboard', () => {
  it('compares with the period before, and says nothing when there was nothing', () => {
    expect(percentChange(120_000, 100_000)).toBe(20);
    expect(percentChange(75_000, 100_000)).toBe(-25);
    expect(percentChange(50_000, 0)).toBeNull();
  });

  it('works out the margin and the average sale in whole shillings', () => {
    expect(marginPercent(55_500, 341_000)).toBe(16);
    expect(marginPercent(1000, 0)).toBeNull();
    expect(averageSale(341_000, 12)).toBe(28_417);
    expect(averageSale(0, 0)).toBe(0);
  });

  it('splits sales by how they were paid, adding up to exactly 100%', () => {
    const mix = paymentMix({ cash: 259_500, mobile: 30_000, bank: 3_000, credit: 48_500 });
    expect(mix.map((p) => p.amount)).toEqual([259_500, 33_000, 48_500]);
    expect(mix.reduce((s, p) => s + p.pct, 0)).toBe(100);
    expect(mix[0]!.pct).toBe(76);
    expect(paymentMix({ cash: 1, mobile: 1, bank: 0, credit: 1 }).reduce((s, p) => s + p.pct, 0)).toBe(100);
    expect(paymentMix({ cash: 0, mobile: 0, bank: 0, credit: 0 }).every((p) => p.pct === 0)).toBe(true);
  });

  it('lists stock that ran out first, then what is at its reorder level', () => {
    const p = (id: string, lowStockLevel: number | null, extra: Partial<{ trackStock: boolean; active: boolean }> = {}) => ({
      id, lowStockLevel, trackStock: true, active: true, ...extra,
    });
    const products = [p('a', 3), p('b', 3), p('c', 3), p('d', null), p('e', 3, { trackStock: false }), p('f', 3, { active: false })];
    const stock = new Map([['a', 2], ['b', 0], ['c', 10], ['d', 1], ['e', 0], ['f', 0]]);
    const alerts = stockAlerts(products, stock);
    expect(alerts.map((a) => [a.product.id, a.status])).toEqual([['b', 'out'], ['a', 'low']]);
  });

  it('compares today with yesterday, this week with last week, this month with the same days last month', () => {
    // 2026-11-12 is a Thursday.
    expect(previousRange('today', '2026-11-12')).toEqual({ start: '2026-11-11', end: '2026-11-11' });
    expect(previousRange('week', '2026-11-12')).toEqual({ start: '2026-11-02', end: '2026-11-05' });
    expect(previousRange('month', '2026-11-12')).toEqual({ start: '2026-10-01', end: '2026-10-12' });
    // March 31st against February: capped at the end of February.
    expect(previousRange('month', '2026-03-31')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(previousRange('month', '2026-01-15')).toEqual({ start: '2025-12-01', end: '2025-12-15' });
  });

  it('values the shelves at buying cost, leaving out what has no cost and what is below zero', () => {
    expect(
      inventoryValue([
        { onHand: 40, unitCost: 15_500 },
        { onHand: 12.5, unitCost: 3_500 },
        { onHand: 3, unitCost: null },
        { onHand: -2, unitCost: 1_000 },
        { onHand: 0, unitCost: null },
      ])
    ).toEqual({ value: 40 * 15_500 + 43_750, uncosted: 1 });
  });
});
