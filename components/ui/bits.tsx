'use client';

import { ChevronLeft } from '@/components/icons';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { Band, BandTitle } from './band';
import { formatTZS } from '@/lib/money';

/** The one way money appears on screen. */
export function Money({
  value,
  className,
  symbol = false,
  signed = false,
}: {
  value: number;
  className?: string;
  symbol?: boolean;
  signed?: boolean;
}) {
  return (
    <span className={cn('tnum', className)}>{formatTZS(value, { symbol, signed })}</span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  back = true,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <Band>
      <div className="flex min-h-14 items-center gap-1 px-2 py-2">
        {back && (
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-band-soft active:bg-band-line"
          >
            <ChevronLeft size={26} />
          </button>
        )}
        <div className={cn('flex min-w-0 flex-1', !back && 'pl-2')}>
          <BandTitle title={title} subtitle={subtitle} />
        </div>
        {action ? <div className="band-action flex shrink-0 items-center">{action}</div> : null}
      </div>
    </Band>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon ? <div className="text-ink-faint">{icon}</div> : null}
      <p className="text-base font-semibold text-ink-soft">{title}</p>
      {body ? <p className="max-w-xs text-sm text-ink-faint">{body}</p> : null}
      {action}
    </div>
  );
}

/** A labelled figure. `tone` carries the meaning: owed money is amber, loss is red. */
export function Stat({
  label,
  value,
  hint,
  tone = 'plain',
  size = 'md',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'plain' | 'brand' | 'debt' | 'loss';
  size?: 'md' | 'lg';
}) {
  const tones = {
    plain: 'text-ink',
    brand: 'text-brand',
    debt: 'text-debt',
    loss: 'text-loss',
  } as const;

  return (
    <div>
      <p className="text-sm font-medium text-ink-soft">{label}</p>
      <p
        className={cn(
          'tnum font-bold tracking-tight',
          size === 'lg' ? 'text-3xl' : 'text-xl',
          tones[tone]
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function Row({
  label,
  value,
  tone = 'plain',
  strong = false,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: 'plain' | 'brand' | 'debt' | 'loss' | 'soft';
  strong?: boolean;
}) {
  const tones = {
    plain: 'text-ink',
    soft: 'text-ink-soft',
    brand: 'text-brand',
    debt: 'text-debt',
    loss: 'text-loss',
  } as const;

  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className={cn('text-[15px]', strong ? 'font-semibold text-ink' : 'text-ink-soft')}>
        {label}
      </span>
      <span className={cn('tnum shrink-0 tabular-nums', strong ? 'font-bold' : 'font-semibold', tones[tone])}>
        {value}
      </span>
    </div>
  );
}

export function Badge({
  children,
  tone = 'plain',
}: {
  children: ReactNode;
  tone?: 'plain' | 'brand' | 'debt' | 'loss' | 'info';
}) {
  const tones = {
    plain: 'bg-line/50 text-ink-soft',
    brand: 'bg-brand-tint text-brand-dark',
    debt: 'bg-debt-tint text-debt',
    loss: 'bg-loss-tint text-loss',
    info: 'bg-info-tint text-info',
  } as const;

  return (
    <span
      className={cn('rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', tones[tone])}
    >
      {children}
    </span>
  );
}

/** Full-width choice list. Used wherever the spec says "pick one of a few". */
export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: readonly { value: T; label: string; hint?: string; icon?: ReactNode }[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        'grid gap-2',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3'
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              'flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-[10px] border px-3 py-2.5 text-left',
              selected
                ? 'border-brand bg-brand-tint text-brand-dark'
                : 'border-line-strong bg-surface text-ink active:bg-paper'
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              {option.icon}
              {option.label}
            </span>
            {option.hint ? (
              <span className="text-xs leading-tight text-ink-faint">{option.hint}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
