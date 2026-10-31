'use client';

import { cn } from '@/lib/cn';

/**
 * One connected control for choosing between a few options (periods, ranges,
 * light/dark): equal widths, never scrolls sideways. The chosen option is a
 * solid fill: black with gold text in Kitabu, the brand colour in Daftari.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  columns,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  /** Wrap onto rows of this many (default: all in one row). */
  columns?: number;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('grid gap-1 rounded-[12px] border border-line bg-surface p-1', className)}
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-11 rounded-[9px] px-1.5 py-1 text-sm leading-tight font-semibold text-balance transition-colors',
              on ? 'seg-on' : 'text-ink-soft active:bg-paper'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
