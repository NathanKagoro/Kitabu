import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { IS_DAFTARI } from '@/lib/edition';

/**
 * The top of every screen. Kitabu: a warm black band with a stripe of the
 * shop's colour under it (the first Daftari's look). Daftari: a clean white
 * bar with a hairline. Colours come from the edition's tokens (globals.css).
 */
export function Band({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-band text-band-ink',
        IS_DAFTARI ? 'border-b border-band-line' : 'border-b-[3px] border-brand',
        className
      )}
    >
      {children}
    </header>
  );
}

/** A screen's title as the edition sets it: Anton capitals in Kitabu, plain bold in Daftari. */
export function BandTitle({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div className="min-w-0 flex-1">
      <h1
        className={cn(
          'truncate leading-tight',
          IS_DAFTARI ? 'text-lg font-bold' : 'font-display text-[22px] tracking-[0.02em] uppercase'
        )}
      >
        {title}
      </h1>
      {subtitle ? <p className={cn('line-clamp-2 text-sm leading-snug text-band-soft', !IS_DAFTARI && 'font-label')}>{subtitle}</p> : null}
    </div>
  );
}
