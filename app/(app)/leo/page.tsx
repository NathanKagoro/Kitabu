'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useApp } from '@/components/app-provider';
import { ShopLogo } from '@/components/brand/shop-logo';
import { ChevronDown, ChevronRight, HandCoins, MessageCircle, Phone, Wallet } from '@/components/icons';
import { SyncIndicator } from '@/components/sync-indicator';
import { Band, BandTitle } from '@/components/ui/band';
import { Money, Row } from '@/components/ui/bits';
import { Segmented } from '@/components/ui/segmented';
import { periodRange, type Period } from '@/lib/calc/periods';
import { splitOf, splitProfit } from '@/lib/calc/profit-split';
import { regularStats } from '@/lib/calc/regulars';
import { summariseDay } from '@/lib/calc/summary';
import { cn } from '@/lib/cn';
import { addDays, businessDay } from '@/lib/date';
import { formatTZS } from '@/lib/money';
import { db } from '@/lib/local/db';
import { loadRange, useCustomers } from '@/lib/local/queries';
import { whatsappLink } from '@/lib/receipt';

const PERIODS: readonly Period[] = ['today', 'week', 'month', 'lastMonth', 'year', 'all'];
const PERIOD_KEY = 'daftari.period';

function savedPeriod(): Period {
  try {
    const value = localStorage.getItem(PERIOD_KEY) as Period | null;
    return value && PERIODS.includes(value) ? value : 'today';
  } catch {
    return 'today';
  }
}

/**
 * Daftari's home: one number (the profit for the period) and one button
 * (record a sale). Below, one tap away: money owed, how the profit is worked
 * out, where it goes, and regulars due for their usual order. The maths is
 * Kitabu's own (summariseDay, profit-split, regulars).
 */
export default function LeoPage() {
  const t = useTranslations('daftari');
  const locale = useLocale();
  const { business, businessId } = useApp();
  const [period, setPeriodState] = useState<Period>('today');
  useEffect(() => {
    // The remembered tab lives on this phone; read after the first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPeriodState(savedPeriod());
  }, []);
  const setPeriod = (next: Period) => {
    setPeriodState(next);
    try {
      localStorage.setItem(PERIOD_KEY, next);
    } catch {
      // Remembering the tab is a convenience only.
    }
  };

  const today = businessDay();
  const range = periodRange(period, today);
  const summary = useLiveQuery(async () => {
    if (!businessId) return null;
    return summariseDay({ ...(await loadRange(businessId, range.start, range.end)), openingCash: 0 });
  }, [businessId, range.start, range.end]);

  // The last seven days, for the summary the owner sends on WhatsApp (to themselves, a partner or a lender).
  const week = useLiveQuery(async () => {
    if (!businessId) return null;
    return summariseDay({ ...(await loadRange(businessId, addDays(today, -6), today)), openingCash: 0 });
  }, [businessId, today]);

  const customers = useCustomers(businessId);
  const owed = customers?.reduce((sum, c) => sum + Math.max(0, c.balance), 0) ?? 0;

  const regulars = useLiveQuery(async () => {
    if (!businessId) return [];
    const sales = await db().sales.where('businessId').equals(businessId).toArray();
    const byCustomer = new Map<string, { day: string; amount: number }[]>();
    for (const sale of sales) {
      if (!sale.customerId || sale.status !== 'complete') continue;
      const list = byCustomer.get(sale.customerId) ?? [];
      list.push({ day: businessDay(sale.clientCreatedAt), amount: sale.total });
      byCustomer.set(sale.customerId, list);
    }
    return [...byCustomer.entries()].map(([customerId, buys]) => ({ customerId, stats: regularStats(buys, today) }));
  }, [businessId, today]);

  const dueList = (regulars ?? [])
    .filter((r) => r.stats.due)
    .map((r) => ({ ...r, customer: customers?.find((c) => c.id === r.customerId) }))
    .filter((r) => r.customer)
    .sort((a, b) => (b.stats.since ?? 0) - (a.stats.since ?? 0));

  const profit = summary?.estimatedProfit ?? 0;
  const buckets = splitOf(business?.settings.profitSplit);
  const shares = splitProfit(profit, buckets);

  const owedCount = customers?.filter((c) => c.balance > 0).length ?? 0;
  const dateLine = new Date().toLocaleDateString(locale === 'en' ? 'en-GB' : 'sw-TZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Africa/Dar_es_Salaam',
  });

  return (
    <>
      <Band>
        <div className="flex min-h-14 items-center gap-2 py-1.5 pr-1 pl-4">
          <ShopLogo src={business?.settings.logoUrl} size={36} />
          <BandTitle title={business?.name ?? t('title')} subtitle={dateLine} />
          <div className="band-action flex shrink-0 items-center">
            <SyncIndicator />
          </div>
        </div>
      </Band>

      <div className="px-3 pt-3">
        <Segmented
          label={t('title')}
          columns={3}
          value={period}
          onChange={setPeriod}
          options={PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) }))}
        />
      </div>

      {/* The one figure that matters: gold on black, the first Daftari's look. */}
      <section className="mx-3 mt-3 overflow-hidden rounded-[14px] bg-band text-band-ink">
        <div className="px-5 pt-4 pb-4">
          <p className="font-label text-[15px] text-band-soft">{t(`profitFor.${period}`)}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-label text-lg text-band-soft">TSh</span>
            <Money value={profit} className={cn('font-display text-[48px] leading-none', profit < 0 ? 'text-loss' : 'text-accent')} />
          </p>
        </div>
        <dl className="grid grid-cols-2 border-t border-band-line">
          <div className="px-5 py-3">
            <dt className="font-label text-[13px] text-band-soft">{t('sales')}</dt>
            <dd>
              <Money value={summary?.salesTotal ?? 0} className="font-display text-xl" />
            </dd>
          </div>
          <div className="border-l border-band-line px-5 py-3">
            <dt className="font-label text-[13px] text-band-soft">{t('salesCountLabel')}</dt>
            <dd className="font-display text-xl tnum">{summary?.salesCount ?? 0}</dd>
          </div>
        </dl>
      </section>

      <div className="px-3 pt-3">
        <Link
          href="/mauzo"
          className="flex h-16 w-full items-center justify-center gap-2 rounded-[14px] bg-brand text-xl font-bold text-on-fill active:bg-brand-dark"
        >
          <Wallet size={24} />
          {t('sell')}
        </Link>
      </div>

      <Link href="/madeni" className="card mx-3 mt-3 flex items-center gap-3 p-4 active:bg-paper">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            owed > 0 ? 'bg-debt-tint text-debt' : 'bg-brand-tint text-brand-dark'
          )}
        >
          <HandCoins size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-ink-soft">{t('owed')}</span>
          {owed > 0 ? (
            <span className="block">
              <Money value={owed} symbol className="text-xl font-bold text-debt" />
              <span className="ml-2 text-sm text-ink-faint">{t('owedPeople', { count: owedCount })}</span>
            </span>
          ) : (
            <span className="block font-semibold">{t('owedNone')}</span>
          )}
        </span>
        <ChevronRight size={20} className="text-ink-faint" />
      </Link>

      {summary ? (
        <details className="card group mx-3 mt-3 px-4">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 font-semibold [&::-webkit-details-marker]:hidden">
            {t('howWorked')}
            <ChevronDown size={20} className="text-ink-faint transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-line pb-1">
            <Row label={t('sales')} value={<Money value={summary.salesTotal} />} />
            <Row label={t('costOfGoods')} value={<Money value={-summary.costOfGoodsSold} />} tone="loss" />
            <Row label={t('expenses')} value={<Money value={-summary.expensesTotal} />} tone="loss" />
            <Row label={t('losses')} value={<Money value={-summary.wasteTotal} />} tone="loss" />
            <Row label={t('profit')} value={<Money value={summary.estimatedProfit} />} strong />
          </div>
        </details>
      ) : null}

      {week ? (
        <a
          href={whatsappLink(
            t('weekly.message', {
              shop: business?.name ?? '',
              from: shortDate(addDays(today, -6), locale),
              to: shortDate(today, locale),
              sales: formatTZS(week.salesTotal, { symbol: true }),
              count: week.salesCount,
              profit: formatTZS(week.estimatedProfit, { symbol: true }),
              expenses: formatTZS(week.expensesTotal, { symbol: true }),
              owed: formatTZS(owed, { symbol: true }),
            })
          )}
          target="_blank"
          rel="noreferrer"
          className="card mx-3 mt-3 flex items-center gap-3 p-4 active:bg-paper"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-dark">
            <MessageCircle size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t('weekly.button')}</span>
            <span className="block text-sm text-ink-soft">{t('weekly.hint')}</span>
          </span>
          <ChevronRight size={20} className="text-ink-faint" />
        </a>
      ) : null}

      <section className="card mx-3 mt-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[17px] font-bold">{t('split.title')}</h2>
          <Link href="/leo/mgawanyo" className="rounded-full border border-line-strong px-3 py-1.5 text-sm font-semibold text-brand">
            {t('split.change')}
          </Link>
        </div>
        {shares.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">{t('split.none')}</p>
        ) : (
          <>
            {/* One bar, cut into the owner's shares. */}
            <div className="mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden>
              {buckets.map((bucket, i) => (
                <span key={bucket.id} style={{ width: `${bucket.pct}%`, background: shadeFor(i) }} />
              ))}
            </div>
            <ul className="mt-3 divide-y divide-line">
              {buckets.map((bucket, i) => {
                const amount = shares.find((x) => x.id === bucket.id)?.amount ?? 0;
                return (
                  <li key={bucket.id} className="flex items-center gap-3 py-2.5">
                    <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: shadeFor(i) }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{bucket.key ? t(`split.keys.${bucket.key}`) : bucket.label}</span>
                      <span className="text-xs text-ink-faint">{bucket.pct}%</span>
                    </span>
                    <Money value={amount} symbol className="font-bold" />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section className="card mx-3 mt-3 mb-6 p-4">
        <h2 className="text-[17px] font-bold">{t('regulars.title')}</h2>
        <p className="text-sm text-ink-soft">{t('regulars.hint')}</p>
        {dueList.length === 0 ? (
          <p className="mt-3 rounded-[10px] bg-paper px-3 py-3 text-sm text-ink-soft">{t('regulars.none')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {dueList.map(({ customer, stats }) => (
              <li key={customer!.id} className="flex items-center gap-3 py-3">
                <span
                  aria-hidden
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    stats.due === 'late' ? 'bg-loss-tint text-loss' : 'bg-debt-tint text-debt'
                  )}
                >
                  {initials(customer!.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{customer!.name}</span>
                  <span className="block text-xs text-ink-soft">
                    {stats.due === 'late' ? t('regulars.late') : t('regulars.due')}: {t('regulars.lastBought', { days: stats.since ?? 0 })}
                  </span>
                </span>
                {customer!.phone ? (
                  <span className="flex gap-1.5">
                    <a
                      href={`tel:${customer!.phone}`}
                      aria-label={t('regulars.call')}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-ink-soft"
                    >
                      <Phone size={19} />
                    </a>
                    <a
                      href={whatsappLink(t('regulars.message', { name: customer!.name, shop: business?.name ?? '' }), customer!.phone)}
                      aria-label={t('regulars.whatsapp')}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-on-fill"
                    >
                      <MessageCircle size={19} />
                    </a>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/** Shares of the profit bar: the brand colour, lighter for each later share. */
function shadeFor(index: number): string {
  const strength = [100, 70, 45, 25, 15, 10][index] ?? 10;
  return `color-mix(in srgb, var(--color-brand) ${strength}%, var(--color-surface))`;
}

/** "26 Okt": a date in the message, the way people write it. */
function shortDate(day: string, locale: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(locale === 'en' ? 'en-GB' : 'sw-TZ', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
