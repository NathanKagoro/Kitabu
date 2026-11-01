'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';

import { formatTZS } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { DayPoint } from '@/lib/calc/summary';

/**
 * Sales-per-day bars as plain buttons. A chart library would be the single
 * heaviest thing on the screen, for a picture that is just "which days were
 * good". Tap (or point at) a bar to read its day and amount above the chart;
 * today is picked to start with. With `compare`, each bar carries a tick at
 * the same weekday the week before, and the readout gives that figure too.
 */
export function BarChart({
  points,
  today,
  compare,
  compareLabel,
}: {
  points: readonly DayPoint[];
  today: string;
  /** The same number of days just before, in the same order. */
  compare?: readonly DayPoint[];
  compareLabel?: string;
}) {
  const locale = useLocale();
  const [picked, setPicked] = useState<string | null>(null);
  const max = Math.max(1, ...points.map((p) => p.total), ...(compare ?? []).map((p) => p.total));
  const dense = points.length > 10;
  const index = Math.max(0, points.findIndex((p) => p.day === (picked ?? today)));
  const current = points[index] ?? points[points.length - 1];
  const before = compare?.[index];
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
        <div className="mb-3 flex min-h-11 items-end justify-between gap-3" aria-live="polite">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-faint">{dayName(current.day)}</p>
            <p className="tnum text-lg leading-tight font-bold">{formatTZS(current.total, { symbol: true })}</p>
          </div>
          {before && compareLabel ? (
            <div className="text-right">
              <p className="text-xs text-ink-faint">{compareLabel}</p>
              <p className="tnum text-sm font-semibold text-ink-soft">{formatTZS(before.total)}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex h-40 items-end gap-[3px]">
        {points.map((point, i) => {
          const height = point.total > 0 ? Math.max(4, (point.total / max) * 100) : 0;
          const ghost = compare?.[i];
          const on = point.day === current?.day;
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
              className="relative flex h-full min-w-0 flex-1 flex-col justify-end rounded-t-[4px] focus-visible:outline-offset-0"
            >
              {ghost && ghost.total > 0 ? (
                <span
                  aria-hidden
                  className="absolute inset-x-0 z-10 border-t-2 border-dashed border-ink-faint/70"
                  style={{ bottom: `${(ghost.total / max) * 100}%` }}
                />
              ) : null}
              <span
                className={cn(
                  'block rounded-t-[4px] transition-colors',
                  on ? 'bg-brand' : point.day === today ? 'bg-brand/60' : 'bg-brand/30'
                )}
                style={{ height: `${height}%` }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[3px] border-t border-line pt-1">
        {points.map((point, index) => (
          <span
            key={point.day}
            className={cn(
              'tnum min-w-0 flex-1 text-center text-[10px]',
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
