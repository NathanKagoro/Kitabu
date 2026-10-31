import { describe, expect, it } from 'vitest';

import { periodRange } from '@/lib/calc/periods';
import { checkSplit, DEFAULT_SPLIT, splitOf, splitProfit } from '@/lib/calc/profit-split';
import { regularStats } from '@/lib/calc/regulars';

describe('where the profit goes', () => {
  it('shares profit by the default percentages', () => {
    expect(splitProfit(228148, DEFAULT_SPLIT)).toEqual([
      { id: 'tithe', amount: 22815 },
      { id: 'reinvest', amount: 79852 },
      { id: 'personal', amount: 68444 },
      { id: 'savings', amount: 57037 },
    ]);
  });

  it('always adds up to the profit exactly', () => {
    for (const profit of [1, 7, 999, 12345, 1000001]) {
      const parts = splitProfit(profit, [{ id: 'a', label: 'A', pct: 33.3 }, { id: 'b', label: 'B', pct: 33.3 }, { id: 'c', label: 'C', pct: 33.4 }]);
      expect(parts.reduce((s, p) => s + p.amount, 0)).toBe(profit);
    }
  });

  it('no profit, or a loss, has nothing to share', () => {
    expect(splitProfit(0, DEFAULT_SPLIT)).toEqual([]);
    expect(splitProfit(-5000, DEFAULT_SPLIT)).toEqual([]);
  });

  it('a split must add to 100 and name every bucket', () => {
    expect(checkSplit(DEFAULT_SPLIT)).toBeNull();
    expect(checkSplit([{ id: 'a', label: 'A', pct: 60 }])).toBe('total');
    expect(checkSplit([{ id: 'a', label: '  ', pct: 100 }])).toBe('names');
    expect(checkSplit([{ id: 'a', label: 'A', pct: 110 }, { id: 'b', label: 'B', pct: -10 }])).toBe('negative');
  });

  it('a missing or broken saved split falls back to the default', () => {
    expect(splitOf(undefined)).toEqual(DEFAULT_SPLIT);
    expect(splitOf([{ id: 'x', label: 'X', pct: 50 }])).toEqual(DEFAULT_SPLIT);
    expect(splitOf([{ id: 'x', label: 'X', pct: 100 }])).toEqual([{ id: 'x', label: 'X', pct: 100 }]);
  });
});

describe('regular customers', () => {
  const buys = (...days: string[]) => days.map((day) => ({ day, amount: 10000 }));

  it('a weekly regular is due around a week later, and late after nine days', () => {
    const history = buys('2026-10-01', '2026-10-08', '2026-10-15');
    expect(regularStats(history, '2026-10-20')).toMatchObject({ gap: 7, since: 5, rhythm: 'weekly', due: null });
    expect(regularStats(history, '2026-10-21').due).toBe('due');
    expect(regularStats(history, '2026-10-25').due).toBe('late');
  });

  it('one visit is new; none is none; two buys on one day count as one visit', () => {
    expect(regularStats(buys('2026-10-01'), '2026-10-20')).toMatchObject({ rhythm: 'new', due: null, orders: 1 });
    expect(regularStats([], '2026-10-20')).toMatchObject({ rhythm: 'none', since: null });
    expect(regularStats(buys('2026-10-01', '2026-10-01', '2026-10-31'), '2026-10-31')).toMatchObject({ orders: 3, gap: 30, rhythm: 'monthly' });
  });
});

describe('periods', () => {
  // 31 Oct 2026 is a Saturday.
  it('weeks start on Monday', () => {
    expect(periodRange('week', '2026-10-31')).toEqual({ start: '2026-10-26', end: '2026-10-31' });
    expect(periodRange('week', '2026-10-26')).toEqual({ start: '2026-10-26', end: '2026-10-26' });
    expect(periodRange('week', '2026-11-01')).toEqual({ start: '2026-10-26', end: '2026-11-01' });
  });

  it('this month, last month (across a year), this year', () => {
    expect(periodRange('month', '2026-10-31')).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(periodRange('lastMonth', '2026-10-31')).toEqual({ start: '2026-09-01', end: '2026-09-30' });
    expect(periodRange('lastMonth', '2026-01-15')).toEqual({ start: '2025-12-01', end: '2025-12-31' });
    expect(periodRange('lastMonth', '2026-03-05')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(periodRange('year', '2026-10-31')).toEqual({ start: '2026-01-01', end: '2026-10-31' });
  });
});
