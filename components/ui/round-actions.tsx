import Link from 'next/link';

import type { Wallet } from '@/components/icons';

export interface RoundAction {
  href: string;
  label: string;
  Icon: typeof Wallet;
}

/** Shortcuts as flat tiles, icon over a short label, each at least 72px tall. */
export function RoundActions({ actions, label }: { actions: readonly RoundAction[]; label: string }) {
  if (!actions.length) return null;
  return (
    <nav aria-label={label} className="mx-3 mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
      {actions.map(({ href, label: name, Icon }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-card)] bg-surface px-1 text-center text-[13px] leading-tight font-bold text-ink active:bg-brand-tint"
        >
          <Icon size={22} className="text-brand" />
          {name}
        </Link>
      ))}
    </nav>
  );
}
