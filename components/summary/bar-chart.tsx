'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';

import type { DayPoint } from '@/lib/calc/summary';
import { cn } from '@/lib/cn';
import { formatTZS } from '@/lib/money';

/** 224000 -> "224k", 1450000 -> "1.5M": short enough for a label on the chart. */
function short(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(amount);
}

/**
 * Sales per day as plain buttons (a chart library would be the heaviest thing
 * on the screen). With `usual`, the chart says something: a dashed line marks
 * a usual day, days that beat it are solid, days under it are pale, the best
 * day carries a flag and today is yellow. Tap a bar to read its day and
 * amount, and how it did against the usual. The bars grow in once, when the
 * screen opens (not for people who turn motion off).
 */
export function BarChart({
  points,
  today,
  usual,
  labels,
}: {
  points: readonly DayPoint[];
  today: string;
  /** A usual day's sales (e.g. the 7-day average before this week). */
  usual?: number;
  labels?: { usual: string; best: string; vsUsual: string };
}) {
  const locale = useLocale();
  const [picked, setPicked] = useState<string | null>(null);
  // Head-room above the tallest bar for its flag.
  const max = Math.max(1, usual ?? 0, ...points.map((p) => p.total)) * 1.25;
  const dense = points.length > 10;
  const index = Math.max(0, points.findIndex((p) => p.day === (picked ?? today)));
  const current = points[index] ?? points[points.length - 1];
  const best = points.reduce<DayPoint | null>((top, p) => (p.total > (top?.total ?? 0) ? p : top), null);
  const vs = usual && current ? Math.round(((current.total - usual) / usual) * 100) : null;
  const dayName = (day: string) =>
    new Date(`${day}T12:00:00Z`).toLocaleDateString(locale === 'en' ? 'en-GB' : 'sw-TZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });

  return (
    <div>
      {current ? (
        <div className="mb-3 flex min-h-12 items-end justify-between gap-3" aria-live="polite">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-faint">{dayName(current.day)}</p>
            <p className="font-display tnum text-[30px] leading-none">{formatTZS(current.total, { symbol: true })}</p>
          </div>
          {vs !== null && labels ? (
            <span
              className={cn(
                'tnum shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
                vs >= 0 ? 'bg-up/12 text-up' : 'bg-down/10 text-down'
              )}
            >
              {vs >= 0 ? '+' : '−'}
              {Math.abs(vs)}% {labels.vsUsual}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="relative flex h-40 items-end gap-2">
        {usual && labels ? (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10" style={{ bottom: `${(usual / max) * 100}%` }}>
            <div className="border-t-2 border-dashed border-ink-faint/60" />
            <span className="absolute -top-2.5 right-0 rounded-full bg-band px-2 py-0.5 text-[10px] font-bold text-band-ink">
              {labels.usual} {short(usual)}
            </span>
          </div>
        ) : null}
        {points.map((point, i) => {
          const height = point.total > 0 ? Math.max(5, (point.total / max) * 100) : 0;
          const on = point.day === current?.day;
          const isToday = point.day === today;
          const beat = usual ? point.total >= usual : true;
          const isBest = best?.day === point.day && points.length > 1 && labels;
          return (
            <button
              key={point.day}
              type="button"
              aria-pressed={on}
              aria-label={`${dayName(point.day)}: ${formatTZS(point.total)}`}
              onClick={() => setPicked(point.day)}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') setPicked(point.day);
              }}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            >
              {isBest ? (
                <span className="absolute z-20 -translate-y-full rounded-full bg-sign px-1.5 py-0.5 text-[10px] font-bold text-sign-ink" style={{ bottom: `${height}%` }}>
                  {labels.best}
                </span>
              ) : null}
              <span
                className={cn(
                  'bar-grow block w-full rounded-t-[10px] rounded-b-[4px]',
                  isToday ? 'bg-sign' : beat ? 'bg-bar' : 'bg-bar/30',
                  on && 'outline-2 outline-offset-2 outline-bar'
                )}
                style={{ height: `${height}%`, animationDelay: `${i * 40}ms` }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {points.map((point, index) => (
          <span
            key={point.day}
            className={cn(
              'tnum min-w-0 flex-1 text-center text-[11px]',
              point.day === current?.day ? 'font-bold text-ink' : 'text-ink-faint'
            )}
          >
            {!dense || index % 5 === 0 || index === points.length - 1 ? Number(point.day.slice(8)) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
