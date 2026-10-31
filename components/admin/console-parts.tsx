'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/bits';
import type { ShopSummary } from '@/lib/auth/accounts';
import { formatPhone } from '@/lib/auth/phone';

const DAY = 86_400_000;

/** Whole days since `iso`, by the calendar in Dar es Salaam; null if never. */
export function daysSince(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const day = (d: Date) => Math.floor((d.getTime() + 3 * 3_600_000) / DAY);
  return Math.max(0, day(now) - day(new Date(iso)));
}

/** The numbers across every shop: how many exist, how many are in use, who has access. */
export function ConsoleOverview({ shops }: { shops: readonly ShopSummary[] }) {
  const t = useTranslations('admin.console');
  const active = shops.filter((s) => s.status !== 'paused').length;
  const usedThisWeek = shops.filter((s) => {
    const days = daysSince(s.lastSeenAt);
    return days !== null && days <= 7;
  }).length;
  const people = shops.reduce((sum, s) => sum + s.people.length, 0);
  const tiles = [
    { label: t('shops'), value: shops.length },
    { label: t('active'), value: active },
    { label: t('usedThisWeek'), value: usedThisWeek },
    { label: t('people'), value: people },
  ];
  return (
    <section className="mx-4 grid grid-cols-2 gap-2" aria-label={t('overview')}>
      {tiles.map((tile) => (
        <div key={tile.label} className="card p-3">
          <p className="text-xs font-semibold text-ink-soft">{tile.label}</p>
          <p className="tnum text-2xl font-bold">{tile.value}</p>
        </div>
      ))}
    </section>
  );
}

/** When the shop was last used, in words, coloured when it has gone quiet. */
export function LastSeen({ shop }: { shop: ShopSummary }) {
  const t = useTranslations('admin.console');
  const days = daysSince(shop.lastSeenAt);
  const text = days === null ? t('never') : days === 0 ? t('today') : days === 1 ? t('yesterday') : t('daysAgo', { days });
  const tone = days === null || days > 7 ? 'text-loss' : days > 2 ? 'text-debt' : 'text-ink-soft';
  return (
    <span className={tone}>
      {t('lastSeen')}: {text}
      {shop.sales30 > 0 ? ` · ${t('sales30', { count: shop.sales30 })}` : ''}
    </span>
  );
}

/** Everyone with access to the shop: role, phone, and whether they have signed in. */
export function ShopPeople({ shop }: { shop: ShopSummary }) {
  const t = useTranslations('admin.console');
  const ts = useTranslations('staff');
  return (
    <details className="rounded-[10px] border border-line">
      <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-semibold">
        {t('whoHasAccess', { count: shop.people.length })}
      </summary>
      <ul className="divide-y divide-line border-t border-line">
        {shop.people.map((person) => (
          <li key={person.memberId} className="flex items-center gap-2 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{person.name || t('noName')}</span>
              <span className="block truncate text-ink-faint">
                {ts(`roles.${person.role}`)}
                {person.phone ? ` · ${formatPhone(person.phone)}` : ''}
              </span>
            </span>
            {person.hasLogin ? <Badge tone="brand">{t('canSignIn')}</Badge> : <Badge tone="info">{t('tillOnly')}</Badge>}
          </li>
        ))}
      </ul>
    </details>
  );
}
