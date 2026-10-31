'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useApp } from '@/components/app-provider';
import { ShopLogo } from '@/components/brand/shop-logo';
import { ChevronRight, MessageCircle, Smartphone, Wallet } from '@/components/icons';
import { SyncIndicator } from '@/components/sync-indicator';
import { Badge, Money, Row } from '@/components/ui/bits';
import { periodRange, type Period } from '@/lib/calc/periods';
import { splitOf, splitProfit } from '@/lib/calc/profit-split';
import { regularStats } from '@/lib/calc/regulars';
import { summariseDay } from '@/lib/calc/summary';
import { cn } from '@/lib/cn';
import { businessDay } from '@/lib/date';
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

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="flex items-center gap-2 py-1.5 pr-1 pl-4">
          <ShopLogo src={business?.settings.logoUrl} size={32} />
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{business?.name ?? t('title')}</h1>
          <SyncIndicator />
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-1" role="tablist" aria-label={t('title')}>
        {PERIODS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={cn(
              'h-10 shrink-0 rounded-full border px-4 text-sm font-semibold',
              period === p ? 'border-brand bg-brand-tint text-brand-dark' : 'border-line-strong bg-surface text-ink-soft'
            )}
          >
            {t(`periods.${p}`)}
          </button>
        ))}
      </div>

      <section className="card m-3 p-5">
        <p className="text-sm font-semibold text-ink-soft">{t('profit')}</p>
        <Money
          value={profit}
          symbol
          className={cn('block text-5xl leading-tight font-bold tracking-tight', profit < 0 ? 'text-loss' : 'text-brand')}
        />
        <p className="mt-1 text-sm text-ink-soft">
          {t('sales')}: <Money value={summary?.salesTotal ?? 0} /> · {t('salesCount', { count: summary?.salesCount ?? 0 })}
        </p>
        <Link
          href="/mauzo"
          className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-[12px] bg-brand text-xl font-bold text-on-fill active:bg-brand-dark"
        >
          <Wallet size={24} />
          {t('sell')}
        </Link>
      </section>

      <Link href="/madeni" className="card mx-3 mb-3 flex min-h-14 items-center gap-3 px-4 py-3 active:bg-paper">
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ink-soft">{t('owed')}</span>
          {owed > 0 ? <Money value={owed} symbol className="text-xl font-bold text-debt" /> : <span className="font-semibold">{t('owedNone')}</span>}
        </span>
        <ChevronRight size={20} className="text-ink-faint" />
      </Link>

      {summary ? (
        <details className="card mx-3 mb-3 px-4 py-1">
          <summary className="flex min-h-12 cursor-pointer items-center font-semibold">{t('howWorked')}</summary>
          <Row label={t('sales')} value={<Money value={summary.salesTotal} />} />
          <Row label={t('costOfGoods')} value={<Money value={-summary.costOfGoodsSold} />} tone="loss" />
          <Row label={t('expenses')} value={<Money value={-summary.expensesTotal} />} tone="loss" />
          <Row label={t('losses')} value={<Money value={-summary.wasteTotal} />} tone="loss" />
          <Row label={t('profit')} value={<Money value={summary.estimatedProfit} />} strong />
        </details>
      ) : null}

      <section className="card mx-3 mb-3 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-bold">{t('split.title')}</h2>
          <Link href="/leo/mgawanyo" className="text-sm font-semibold text-brand">
            {t('split.change')}
          </Link>
        </div>
        {shares.length === 0 ? (
          <p className="text-sm text-ink-soft">{t('split.none')}</p>
        ) : (
          <ul className="space-y-3">
            {buckets.map((bucket) => {
              const amount = shares.find((s) => s.id === bucket.id)?.amount ?? 0;
              return (
                <li key={bucket.id}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span>
                      {bucket.key ? t(`split.keys.${bucket.key}`) : bucket.label} <span className="text-ink-faint">{bucket.pct}%</span>
                    </span>
                    <Money value={amount} className="font-bold" />
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, bucket.pct)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card mx-3 mb-6 p-4">
        <h2 className="font-bold">{t('regulars.title')}</h2>
        <p className="mb-2 text-sm text-ink-soft">{t('regulars.hint')}</p>
        {dueList.length === 0 ? (
          <p className="text-sm text-ink-faint">{t('regulars.none')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {dueList.map(({ customer, stats }) => (
              <li key={customer!.id} className="flex items-center gap-2 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{customer!.name}</span>
                    {stats.due === 'late' ? <Badge tone="loss">{t('regulars.late')}</Badge> : <Badge tone="debt">{t('regulars.due')}</Badge>}
                  </span>
                  <span className="block text-xs text-ink-faint">
                    {t(`regulars.rhythm.${stats.rhythm}`)} · {t('regulars.lastBought', { days: stats.since ?? 0 })}
                  </span>
                </span>
                {customer!.phone ? (
                  <>
                    <a
                      href={`tel:${customer!.phone}`}
                      aria-label={t('regulars.call')}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-ink-soft"
                    >
                      <Smartphone size={20} />
                    </a>
                    <a
                      href={whatsappLink(t('regulars.message', { name: customer!.name, shop: business?.name ?? '' }), customer!.phone)}
                      aria-label={t('regulars.whatsapp')}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-brand text-brand"
                    >
                      <MessageCircle size={20} />
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
