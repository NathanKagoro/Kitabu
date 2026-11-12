import Link from 'next/link';

import type { Wallet } from '@/components/icons';

export interface RoundAction {
  href: string;
  label: string;
  Icon: typeof Wallet;
}

/**
 * Shortcuts as round buttons with the label under them, the way a bank or
 * M-Pesa app lays out "Send money" and "Pay bill": familiar to every shop
 * owner, and each a 52px circle inside a tap area of 80px or more.
 */
export function RoundActions({ actions, label }: { actions: readonly RoundAction[]; label: string }) {
  if (!actions.length) return null;
  return (
    <nav aria-label={label} className="mx-3 mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
      {actions.map(({ href, label: name, Icon }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          className="group flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-[14px] px-1 text-center text-[13px] leading-tight font-semibold text-ink"
        >
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-surface text-brand group-active:bg-brand-tint">
            <Icon size={22} />
          </span>
          {name}
        </Link>
      ))}
    </nav>
  );
}
