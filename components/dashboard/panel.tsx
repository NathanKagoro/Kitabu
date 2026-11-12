import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowDownRight, ArrowUpRight, ChevronRight } from '@/components/icons';
import { cn } from '@/lib/cn';

/**
 * A section of the dashboard: a white card with a bold title, and, when the
 * section leads somewhere, a footer link across its full width.
 */
export function Panel({
  title,
  aside,
  footer,
  children,
  className,
}: {
  title: string;
  aside?: ReactNode;
  footer?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mx-3 mt-3 overflow-hidden rounded-[18px] bg-surface', className)}>
      <header className="flex min-h-[52px] items-center gap-2 px-4">
        <h2 className="min-w-0 flex-1 truncate text-base font-bold">{title}</h2>
        {aside}
      </header>
      {children}
      {footer ? (
        <Link
          href={footer.href}
          className="flex min-h-12 items-center justify-between border-t border-line px-4 text-sm font-semibold text-brand active:bg-paper"
        >
          {footer.label}
          <ChevronRight size={18} />
        </Link>
      ) : null}
    </section>
  );
}

/** A rise or fall against the period before, green up and red down; a plain dash when there is nothing to compare. */
export function Change({
  pct,
  invert = false,
  label,
  empty,
  onDark = false,
}: {
  pct: number | null;
  invert?: boolean;
  label: string;
  /** Said instead when there is nothing to compare with. */
  empty: string;
  /** On the navy sales card: lighter greens and reds on a translucent chip. */
  onDark?: boolean;
}) {
  const muted = onDark ? 'text-band-soft' : 'text-ink-faint';
  if (pct === null) return <span className={cn('text-xs', muted)}>{empty}</span>;
  const good = invert ? pct <= 0 : pct >= 0;
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5 text-xs', muted)}>
      <span
        className={cn(
          'tnum inline-flex items-center gap-0.5 rounded-[6px] px-1.5 py-0.5 font-bold',
          onDark ? cn('bg-white/12', good ? 'text-[#8fe0b4]' : 'text-[#ffaba4]') : good ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
        )}
      >
        {pct >= 0 ? <ArrowUpRight size={13} strokeWidth={2.6} /> : <ArrowDownRight size={13} strokeWidth={2.6} />}
        {Math.abs(pct)}%
      </span>
      {label}
    </span>
  );
}
