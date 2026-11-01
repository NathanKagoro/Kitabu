import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowDownRight, ArrowUpRight, ChevronRight } from '@/components/icons';
import { cn } from '@/lib/cn';

/**
 * A section of the dashboard, the way an office system draws one: a white
 * panel with a title bar ruled off from its content, and, when the section
 * leads somewhere, a footer link across its full width.
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
    <section className={cn('mx-3 mt-3 overflow-hidden rounded-[12px] border border-line bg-surface', className)}>
      <header className="flex min-h-12 items-center gap-2 border-b border-line px-4">
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</h2>
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
}: {
  pct: number | null;
  invert?: boolean;
  label: string;
  /** Said instead when there is nothing to compare with. */
  empty: string;
}) {
  if (pct === null) return <span className="text-xs text-ink-faint">{empty}</span>;
  const good = invert ? pct <= 0 : pct >= 0;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
      <span
        className={cn(
          'tnum inline-flex items-center gap-0.5 rounded-[6px] px-1.5 py-0.5 font-bold',
          good ? 'bg-up/10 text-up' : 'bg-down/10 text-down'
        )}
      >
        {pct >= 0 ? <ArrowUpRight size={13} strokeWidth={2.6} /> : <ArrowDownRight size={13} strokeWidth={2.6} />}
        {Math.abs(pct)}%
      </span>
      {label}
    </span>
  );
}
