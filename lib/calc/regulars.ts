/**
 * Regular customers: how often each one buys, and who is due or late for
 * their usual order ("Wateja wa kupigia simu"). Came from Daftari; pure and
 * tested. Works on business days (YYYY-MM-DD, Dar es Salaam).
 */
import { daysBetween } from '../date';

export type Rhythm = 'none' | 'new' | 'weekly' | 'fortnightly' | 'monthly' | 'rare';
export type DueState = 'due' | 'late' | null;

export interface RegularStats {
  orders: number;
  spent: number;
  lastDay: string | null;
  /** Average days between buying days; null with fewer than two. */
  gap: number | null;
  /** Days since the last buying day; null if never bought. */
  since: number | null;
  rhythm: Rhythm;
  due: DueState;
}

export function regularStats(
  purchases: readonly { day: string; amount: number }[],
  today: string
): RegularStats {
  const days = [...new Set(purchases.map((p) => p.day))].sort();
  const spent = purchases.reduce((sum, p) => sum + p.amount, 0);
  const lastDay = days[days.length - 1] ?? null;
  const gap = days.length >= 2 ? daysBetween(days[0]!, lastDay!) / (days.length - 1) : null;
  const since = lastDay ? daysBetween(lastDay, today) : null;

  const rhythm: Rhythm =
    days.length === 0 ? 'none' : gap === null ? 'new' : gap <= 10 ? 'weekly' : gap <= 20 ? 'fortnightly' : gap <= 40 ? 'monthly' : 'rare';

  // Late past 1.3x their usual gap; due from 0.85x.
  let due: DueState = null;
  if (gap !== null && gap > 0 && since !== null) {
    if (since > gap * 1.3) due = 'late';
    else if (since >= gap * 0.85) due = 'due';
  }
  return { orders: purchases.length, spent, lastDay, gap, since, rhythm, due };
}
