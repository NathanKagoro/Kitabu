/**
 * The periods a summary can cover, as inclusive business days in Dar es
 * Salaam. Weeks start on Monday. Came from Daftari; shared with Kitabu.
 */
import { addDays, businessDay } from '../date';

export type Period = 'today' | 'week' | 'month' | 'lastMonth' | 'year' | 'all';

export interface DayRange {
  start: string;
  end: string;
}

export function periodRange(period: Period, today: string = businessDay()): DayRange {
  const [y, m] = today.split('-').map(Number) as [number, number];
  const pad = (n: number) => String(n).padStart(2, '0');
  switch (period) {
    case 'today':
      return { start: today, end: today };
    case 'week': {
      // Day of the week of a calendar date, independent of the phone's time zone.
      const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 Sunday
      return { start: addDays(today, -((weekday + 6) % 7)), end: today };
    }
    case 'month':
      return { start: `${y}-${pad(m)}-01`, end: today };
    case 'lastMonth': {
      const first = m === 1 ? `${y - 1}-12-01` : `${y}-${pad(m - 1)}-01`;
      return { start: first, end: addDays(`${y}-${pad(m)}-01`, -1) };
    }
    case 'year':
      return { start: `${y}-01-01`, end: today };
    case 'all':
      return { start: '2000-01-01', end: today };
  }
}

/**
 * The stretch to compare a period with, the same length and just before it:
 * yesterday for today, the same days of last week for this week, and the
 * same days of last month for this month ("1st–12th" against "1st–12th").
 */
export function previousRange(period: 'today' | 'week' | 'month', today: string = businessDay()): DayRange {
  const current = periodRange(period, today);
  if (period === 'today') return { start: addDays(today, -1), end: addDays(today, -1) };
  if (period === 'week') return { start: addDays(current.start, -7), end: addDays(current.end, -7) };
  const last = periodRange('lastMonth', today);
  const span = Number(today.slice(8)) - 1;
  const end = addDays(last.start, span);
  return { start: last.start, end: end > last.end ? last.end : end };
}
