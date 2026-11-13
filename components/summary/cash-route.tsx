import type { ReactNode } from 'react';

import { Money } from '@/components/ui/bits';
import { cn } from '@/lib/cn';

export interface RouteStop {
  label: string;
  amount: number;
  /** Shows the sign: money coming in (+) or going out (−). */
  flow?: 'in' | 'out';
  /** The stop the route ends at: drawn larger, with a filled marker. */
  end?: boolean;
  note?: ReactNode;
}

/**
 * The cash drawer as a route, the way a daladala board lists its stops: what
 * the day started with, what came in, what went out, and where it ends up.
 * The steps really are a sequence, so they are drawn as one.
 */
export function CashRoute({ stops }: { stops: readonly RouteStop[] }) {
  return (
    <ol className="relative">
      {stops.map((stop, i) => (
        <li key={stop.label} className={cn('relative flex items-center gap-3', stop.end ? 'min-h-14' : 'min-h-11')}>
          {i < stops.length - 1 ? (
            <span aria-hidden className="absolute top-1/2 left-[9px] h-full border-l-[3px] border-band/80" />
          ) : null}
          <span
            aria-hidden
            className={cn(
              'relative z-10 h-[21px] w-[21px] shrink-0 rounded-full border-[3px]',
              stop.end ? 'border-sign bg-sign' : 'border-band bg-surface'
            )}
          />
          <span className="min-w-0 flex-1">
            <span className={cn('block', stop.end ? 'font-bold' : 'text-[15px] text-ink-soft')}>{stop.label}</span>
            {stop.note ? <span className="block text-xs text-ink-faint">{stop.note}</span> : null}
          </span>
          <Money
            value={stop.flow === 'out' ? -stop.amount : stop.amount}
            signed={stop.flow === 'in'}
            className={cn(
              'font-display leading-none',
              stop.end ? 'text-[34px]' : 'text-[22px]',
              stop.flow === 'in' && 'text-up',
              stop.flow === 'out' && 'text-down',
              stop.end && stop.amount < 0 && 'text-loss'
            )}
          />
        </li>
      ))}
    </ol>
  );
}
