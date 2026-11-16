'use client';

import { useState } from 'react';

import { cn } from '@/lib/cn';
import { formatTZS } from '@/lib/money';

/** One bar: a day ("2026-11-16") or an hour ("13"), its sales, and whether it is still ahead. */
export interface ChartPoint {
  key: string;
  total: number;
  /** Time still to come in the period: drawn as an empty slot, not tappable. */
  future?: boolean;
}

/** 224000 -> "224k", 1450000 -> "1.5M": short enough for a label on the chart. */
function short(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(amount);
}

/**
 * Sales per day or per hour as plain buttons (a chart library would be the
 * heaviest thing on the screen). With `usual`, the chart says something: a
 * dashed line marks a usual day, days that beat it are solid, days under it
 * are pale, the best one carries a flag and the current one is yellow. Time
 * still ahead in the period shows as empty slots, so a Tuesday's week chart
 * shows how much of the week is left. Tap a bar to read it. The bars grow in
 * once when the screen opens (not for people who turn motion off).
 */
export function BarChart({
  points,
  current: currentKey,
  name,
  tick,
  usual,
  labels,
}: {
  points: readonly ChartPoint[];
  /** The bar picked to start with, and drawn yellow: today, or this hour. */
  current: string;
  /** What the readout calls a bar: "Monday 16 Nov", "13:00". */
  name: (key: string) => string;
  /** The label under a bar; empty to leave a gap. */
  tick: (key: string, index: number) => string;
  usual?: number;
  labels?: { usual: string; best: string; vsUsual: string };
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const past = points.filter((p) => !p.future);
  const max = Math.max(1, usual ?? 0, ...past.map((p) => p.total)) * 1.25; // head-room for the flag
  // Start on the current bar, or the latest one with sales if the current one has none yet.
  const opening = past.find((p) => p.key === currentKey && p.total > 0) ?? [...past].reverse().find((p) => p.total > 0) ?? past[past.length - 1];
  const selected = (picked ? past.find((p) => p.key === picked) : null) ?? opening;
  const best = past.reduce<ChartPoint | null>((top, p) => (p.total > (top?.total ?? 0) ? p : top), null);
  const vs = usual && selected && selected.total > 0 ? Math.round(((selected.total - usual) / usual) * 100) : null;
  const dense = points.length > 20;
  const gap = dense ? 'gap-[2px]' : points.length > 10 ? 'gap-1' : 'gap-2';

  return (
    <div>
      {selected ? (
        <div className="mb-3 flex min-h-12 items-end justify-between gap-3" aria-live="polite">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-faint">{name(selected.key)}</p>
            <p className="font-display tnum text-[30px] leading-none">{formatTZS(selected.total, { symbol: true })}</p>
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

      <div className={cn('relative flex h-40 items-end', gap)}>
        {usual && labels ? (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10" style={{ bottom: `${(usual / max) * 100}%` }}>
            <div className="border-t-2 border-dashed border-ink-faint/60" />
            <span className="absolute -top-2.5 right-0 rounded-full bg-band px-2 py-0.5 text-[10px] font-bold text-band-ink">
              {labels.usual} {short(usual)}
            </span>
          </div>
        ) : null}
        {points.map((point, i) => {
          if (point.future) {
            return <span key={point.key} aria-hidden className="h-1.5 min-w-0 flex-1 rounded-full bg-line" />;
          }
          const height = point.total > 0 ? Math.max(4, (point.total / max) * 100) : 0;
          const on = point.key === selected?.key;
          const isCurrent = point.key === currentKey;
          const beat = usual ? point.total >= usual : true;
          const isBest = labels && best?.key === point.key && past.length > 1 && !dense;
          return (
            <button
              key={point.key}
              type="button"
              aria-pressed={on}
              aria-label={`${name(point.key)}: ${formatTZS(point.total)}`}
              onClick={() => setPicked(point.key)}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') setPicked(point.key);
              }}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            >
              {isBest ? (
                <span
                  className="absolute z-20 mb-1 -translate-y-full rounded-full bg-sign px-1.5 py-0.5 text-[10px] font-bold text-sign-ink"
                  style={{ bottom: `${height}%` }}
                >
                  {labels.best}
                </span>
              ) : null}
              <span
                className={cn(
                  'bar-grow block w-full',
                  dense ? 'rounded-t-[3px]' : 'rounded-t-[10px] rounded-b-[4px]',
                  isCurrent ? 'bg-sign' : beat ? 'bg-bar' : 'bg-bar/30',
                  on && 'outline-2 outline-offset-2 outline-bar'
                )}
                style={{ height: `${height}%`, animationDelay: `${Math.min(i, 12) * 35}ms` }}
              />
            </button>
          );
        })}
      </div>
      <div className={cn('mt-2 flex', gap)}>
        {points.map((point, index) => (
          <span
            key={point.key}
            className={cn(
              'tnum min-w-0 flex-1 text-center text-[11px] whitespace-nowrap',
              point.key === selected?.key ? 'font-bold text-ink' : 'text-ink-faint'
            )}
          >
            {tick(point.key, index)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The readout name for a day: "Monday 16 Nov", or the Swahili equivalent. */
export function dayName(day: string, locale: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(locale === 'en' ? 'en-GB' : 'sw-TZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** The day of the month under a bar; with many bars, only every fifth and the last. */
export function dayTick(count: number) {
  return (key: string, index: number) => (count <= 10 || index % 5 === 0 || index === count - 1 ? String(Number(key.slice(8))) : '');
}

/** Days as chart points; days after today are still ahead. */
export function dayPoints(days: readonly { day: string; total: number }[], today: string): ChartPoint[] {
  return days.map((d) => ({ key: d.day, total: d.total, future: d.day > today }));
}
