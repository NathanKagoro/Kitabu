import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { IS_DAFTARI } from '@/lib/edition';

/**
 * The top of every screen. Daftari: a warm black band with a stripe of the
 * shop's colour under it (the first Daftari's look). Kitabu: a navy bar with a
 * yellow rule, the colours of its signboard. Colours come from the edition's tokens (globals.css).
 */
export function Band({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-band text-band-ink',
        IS_DAFTARI ? 'border-b-[3px] border-brand' : 'border-b-[4px] border-sign',
        className
      )}
    >
      {children}
    </header>
  );
}

/** A screen's title, signwritten: Anton capitals in Daftari, Big Shoulders capitals in Kitabu. */
export function BandTitle({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div className="min-w-0 flex-1">
      <h1
        className={cn(
          'truncate leading-tight',
          IS_DAFTARI ? 'font-display text-[22px] tracking-[0.02em] uppercase' : 'font-display text-[25px] tracking-[0.01em] uppercase'
        )}
      >
        {title}
      </h1>
      {subtitle ? <p className={cn('line-clamp-2 text-sm leading-snug text-band-soft', IS_DAFTARI && 'font-label')}>{subtitle}</p> : null}
    </div>
  );
}
