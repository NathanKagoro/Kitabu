'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';

import { useApp } from '@/components/app-provider';
import { ShopLogo } from '@/components/brand/shop-logo';
import { Change, Panel } from '@/components/dashboard/panel';
import { CircleCheck, Lock, Receipt, ShoppingCart, Wallet } from '@/components/icons';
import { BarChart } from '@/components/summary/bar-chart';
import { SyncIndicator } from '@/components/sync-indicator';
import { Band, BandTitle } from '@/components/ui/band';
import { Money } from '@/components/ui/bits';
import { Segmented } from '@/components/ui/segmented';
import { averageSale, marginPercent, paymentMix, percentChange, stockAlerts } from '@/lib/calc/dashboard';
import { periodRange, previousRange } from '@/lib/calc/periods';
import { salesByDay, summariseDay, topProducts } from '@/lib/calc/summary';
import { cn } from '@/lib/cn';
import { addDays, businessDay, recentDays } from '@/lib/date';
import { openingCashFor } from '@/lib/local/actions';
import { db } from '@/lib/local/db';
import { loadRange, useCustomers, useProducts, useStock } from '@/lib/local/queries';
import { productLabel } from '@/lib/products';
import { formatQty } from '@/lib/units';

type DashPeriod = 'today' | 'week' | 'month';
const PERIODS: readonly DashPeriod[] = ['today', 'week', 'month'];
const PERIOD_KEY = 'kitabu.dashboardPeriod';

/** Colours of the payment-mix bar: the shop's colour, a lighter shade of it, and amber for credit. */
const MIX_COLOUR = {
  cash: 'var(--color-brand)',
  mobile: 'color-mix(in srgb, var(--color-brand) 45%, var(--color-surface))',
  credit: 'var(--color-debt)',
} as const;

/**
 * Kitabu's home: the state of the business on one screen, the way an office
 * system opens. Sales, profit, the average sale, expenses and money owed,
 * each against the period before; shortcuts to the day's work; the cash
 * drawer; the week's trend; how customers paid; stock to reorder; best
 * sellers; the latest sales; and, with staff, who sold what. The till is one
 * tap away. Every figure comes from the same maths as Hesabu and Daftari.
 */
export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tp = useTranslations('payment.methods');
  const locale = useLocale();
  const { business, businessId, can, show } = useApp();
  const [period, setPeriodState] = useState<DashPeriod>('today');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERIOD_KEY) as DashPeriod | null;
      // The remembered period lives on this phone; read after the first paint.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && PERIODS.includes(saved)) setPeriodState(saved);
    } catch {
      // A convenience only.
    }
  }, []);
  const setPeriod = (next: DashPeriod) => {
    setPeriodState(next);
    try {
      localStorage.setItem(PERIOD_KEY, next);
    } catch {
      // A convenience only.
    }
  };

  const today = businessDay();
  const range = periodRange(period, today);
  const before = previousRange(period, today);

  const data = useLiveQuery(async () => {
    if (!businessId) return null;
    const [current, previous, todayRows, fortnight, openingCash, closed, members] = await Promise.all([
      loadRange(businessId, range.start, range.end),
      loadRange(businessId, before.start, before.end),
      loadRange(businessId, today, today),
      loadRange(businessId, addDays(today, -13), today),
      openingCashFor(businessId, today),
      db().dayClosings.where('[businessId+date]').equals([businessId, today]).first(),
      db().members.where('businessId').equals(businessId).toArray(),
    ]);
    const now = summariseDay({ ...current, openingCash: 0 });
    const then = summariseDay({ ...previous, openingCash: 0 });
    const drawer = summariseDay({ ...todayRows, openingCash });

    const complete = current.sales.filter((s) => s.status === 'complete');
    const live = new Set(complete.map((s) => s.id));
    const top = topProducts(current.saleLines.filter((l) => live.has(l.saleId)), 5);
    const topNames = await db().products.bulkGet(top.map((p) => p.productId));

    const names = new Map(members.map((m) => [m.id, m.name]));
    const lineCount = new Map<string, number>();
    for (const line of current.saleLines) lineCount.set(line.saleId, (lineCount.get(line.saleId) ?? 0) + 1);
    const methodOf = new Map<string, string>();
    for (const payment of current.payments) {
      if (!payment.saleId || payment.direction !== 'in') continue;
      methodOf.set(payment.saleId, methodOf.has(payment.saleId) ? 'split' : payment.method);
    }
    const recent = [...complete]
      .sort((a, b) => b.clientCreatedAt.localeCompare(a.clientCreatedAt))
      .slice(0, 5)
      .map((sale) => ({
        id: sale.id,
        at: sale.clientCreatedAt,
        total: sale.total,
        items: lineCount.get(sale.id) ?? 0,
        seller: sale.memberId ? (names.get(sale.memberId) ?? null) : null,
        method: methodOf.get(sale.id) ?? 'credit',
      }));

    const bySeller = new Map<string, number>();
    for (const sale of complete) {
      const key = sale.memberId ?? '';
      bySeller.set(key, (bySeller.get(key) ?? 0) + sale.total);
    }
    const sellers = [...bySeller.entries()]
      .map(([id, total]) => ({ id, name: names.get(id) || null, total }))
      .sort((a, b) => b.total - a.total);

    const days = recentDays(14, today);
    const points = salesByDay(fortnight.sales, days, (s) => businessDay(s.clientCreatedAt));
    return {
      now,
      then,
      drawer,
      openingCash,
      closed: Boolean(closed),
      top: top.map((p, i) => ({ ...p, name: topNames[i] ? productLabel(topNames[i]) : '—' })),
      recent,
      sellers,
      lastWeek: points.slice(0, 7),
      thisWeek: points.slice(7),
    };
  }, [businessId, today, range.start, range.end, before.start, before.end]);

  const products = useProducts(businessId);
  const stock = useStock(businessId);
  const customers = useCustomers(businessId);

  const dateLine = new Date().toLocaleDateString(locale === 'en' ? 'en-GB' : 'sw-TZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Africa/Dar_es_Salaam',
  });

  const header = (
    <Band>
      <div className="flex min-h-14 items-center gap-2.5 py-1.5 pr-1 pl-4">
        <ShopLogo src={business?.settings.logoUrl} size={34} className="rounded-[8px] bg-surface" />
        <BandTitle title={business?.name ?? t('title')} subtitle={dateLine} />
        <div className="band-action flex shrink-0 items-center">
          <SyncIndicator />
        </div>
      </div>
    </Band>
  );
  if (!data) return header;

  const { now, then, drawer } = data;
  const owed = customers?.reduce((sum, c) => sum + Math.max(0, c.balance), 0) ?? 0;
  const owing = customers?.filter((c) => c.balance > 0).length ?? 0;
  const versus = t(`versus.${period}`);
  const mix = paymentMix(now);
  const alerts = products && stock ? stockAlerts(products, stock) : [];
  const outCount = alerts.filter((a) => a.status === 'out').length;
  const lowCount = alerts.length - outCount;
  const weekTotal = data.thisWeek.reduce((s, p) => s + p.total, 0);
  const lastWeekTotal = data.lastWeek.reduce((s, p) => s + p.total, 0);
  const topMax = Math.max(1, ...data.top.map((p) => p.total));
  const sellerMax = Math.max(1, ...data.sellers.map((s) => s.total));
  const showProfit = can('viewProfit');

  const actions = [
    { href: '/mauzo', label: t('actions.sell'), Icon: Wallet, primary: true, ok: can('sell') },
    { href: '/manunuzi', label: t('actions.buy'), Icon: ShoppingCart, primary: false, ok: can('recordPurchase') },
    { href: '/matumizi', label: t('actions.expense'), Icon: Receipt, primary: false, ok: can('recordExpense') && show('expenses') },
    { href: '/hesabu', label: t('actions.close'), Icon: Lock, primary: false, ok: can('closeDay') },
  ].filter((a) => a.ok);

  return (
    <>
      {header}

      <div className="px-3 pt-3">
        <Segmented
          label={t('periodLabel')}
          value={period}
          onChange={setPeriod}
          options={PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) }))}
        />
      </div>

      {/* The figures, as one statement: sales across the top, the rest beneath it, ruled into cells. */}
      <section className="mx-3 mt-3 overflow-hidden rounded-[12px] border border-line bg-surface" aria-label={t('figures')}>
        <div className="border-b border-line px-4 pt-3.5 pb-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-medium text-ink-soft">{t('kpi.sales')}</p>
            <p className="tnum text-xs text-ink-faint">{t('kpi.salesCount', { count: now.salesCount })}</p>
          </div>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-ink-soft">TSh</span>
            <Money value={now.salesTotal} className="text-[34px] leading-none font-bold tracking-tight" />
          </p>
          <div className="mt-2">
            <Change pct={percentChange(now.salesTotal, then.salesTotal)} label={versus} empty={t('noCompare')} />
          </div>
        </div>
        <div className="grid grid-cols-2">
          {showProfit ? (
            <Figure label={t('kpi.profit')} value={now.estimatedProfit} tone={now.estimatedProfit < 0 ? 'loss' : 'plain'}>
              {marginPercent(now.estimatedProfit, now.salesTotal) === null ? (
                <span className="text-xs text-ink-faint">{t('kpi.noMargin')}</span>
              ) : (
                <span className="text-xs text-ink-faint">{t('kpi.margin', { pct: marginPercent(now.estimatedProfit, now.salesTotal) ?? 0 })}</span>
              )}
            </Figure>
          ) : (
            <Figure label={t('kpi.cashSales')} value={now.cash}>
              <span className="text-xs text-ink-faint">{t('kpi.cashSalesHint')}</span>
            </Figure>
          )}
          <Figure label={t('kpi.average')} value={averageSale(now.salesTotal, now.salesCount)} divider>
            <Change
              pct={percentChange(averageSale(now.salesTotal, now.salesCount), averageSale(then.salesTotal, then.salesCount))}
              label={t('kpi.perSale')}
              empty={t('noCompare')}
            />
          </Figure>
          <Figure label={t('kpi.expenses')} value={now.expensesTotal} top>
            <Change pct={percentChange(now.expensesTotal, then.expensesTotal)} invert label={versus} empty={t('noCompare')} />
          </Figure>
          <Figure label={t('kpi.owed')} value={owed} tone={owed > 0 ? 'debt' : 'plain'} top divider href="/madeni">
            <span className="text-xs text-ink-faint">{t('kpi.owedPeople', { count: owing })}</span>
          </Figure>
        </div>
      </section>

      {actions.length ? (
        <nav
          aria-label={t('actions.title')}
          className="mx-3 mt-3 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
        >
          {actions.map(({ href, label, Icon, primary }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={cn(
                'flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[12px] border px-1 text-center text-[13px] leading-tight font-semibold',
                primary ? 'border-brand bg-brand text-on-fill active:bg-brand-dark' : 'border-line bg-surface text-ink active:bg-paper'
              )}
            >
              <Icon size={22} className={primary ? undefined : 'text-brand'} />
              {label}
            </Link>
          ))}
        </nav>
      ) : null}

      <Panel
        title={t('drawer.title')}
        aside={
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              data.closed ? 'bg-line/60 text-ink-soft' : 'bg-up/10 text-up'
            )}
          >
            {data.closed ? <Lock size={12} /> : <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-up" />}
            {data.closed ? t('drawer.closed') : t('drawer.open')}
          </span>
        }
        footer={{ href: '/hesabu', label: t('drawer.link') }}
      >
        <div className="px-4 py-3">
          <p className="text-[13px] text-ink-soft">{t('drawer.expected')}</p>
          <Money
            value={drawer.expectedCash}
            symbol
            className={cn('block text-[26px] leading-tight font-bold', drawer.expectedCash < 0 && 'text-loss')}
          />
        </div>
        <dl className="grid grid-cols-3 border-t border-line text-sm">
          <Cell label={t('drawer.opening')} value={data.openingCash} />
          <Cell label={t('drawer.cashIn')} value={drawer.cashIn} sign="+" />
          <Cell label={t('drawer.cashOut')} value={drawer.cashSpent + drawer.cashWithdrawals} sign="-" />
        </dl>
      </Panel>

      <Panel title={t('trend.title')} aside={<Money value={weekTotal} symbol className="text-sm font-bold" />}>
        <div className="px-4 pt-4 pb-2">
          <BarChart points={data.thisWeek} today={today} compare={data.lastWeek} compareLabel={t('trend.sameDayBefore')} />
        </div>
        <dl className="grid grid-cols-3 border-t border-line text-sm">
          <Cell label={t('trend.average')} value={Math.round(weekTotal / 7)} />
          <Cell label={t('trend.before')} value={lastWeekTotal} />
          <div className="border-l border-line px-3 py-2.5">
            <dt className="text-xs text-ink-faint">{t('trend.change')}</dt>
            <dd className="mt-1">
              <Change pct={percentChange(weekTotal, lastWeekTotal)} label="" empty="—" />
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel title={t('mix.title')} aside={<span className="text-xs text-ink-faint">{t(`periods.${period}`)}</span>}>
        {now.salesTotal > 0 ? (
          <div className="px-4 pt-4 pb-1">
            <div className="flex h-3 overflow-hidden rounded-full bg-line" aria-hidden>
              {mix.map((part) => (
                <span key={part.key} style={{ width: `${part.pct}%`, background: MIX_COLOUR[part.key] }} />
              ))}
            </div>
            <ul className="mt-2 divide-y divide-line">
              {mix.map((part) => (
                <li key={part.key} className="flex items-center gap-3 py-2.5">
                  <span aria-hidden className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: MIX_COLOUR[part.key] }} />
                  <span className="min-w-0 flex-1 text-[15px]">{t(`mix.${part.key}`)}</span>
                  <span className="tnum w-10 text-right text-sm text-ink-faint">{part.pct}%</span>
                  <Money value={part.amount} className="w-24 text-right font-semibold" />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="px-4 py-5 text-sm text-ink-soft">{t('noSales')}</p>
        )}
      </Panel>

      {show('stockTracking') ? (
        <Panel
          title={t('stock.title')}
          aside={
            alerts.length ? (
              <span className="flex gap-1.5">
                {outCount ? <Pill tone="loss">{t('stock.out', { count: outCount })}</Pill> : null}
                {lowCount ? <Pill tone="debt">{t('stock.low', { count: lowCount })}</Pill> : null}
              </span>
            ) : null
          }
          footer={{ href: outCount || lowCount ? `/bidhaa?onyesha=${outCount ? 'out' : 'low'}` : '/bidhaa', label: t('stock.all') }}
        >
          {alerts.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-4 text-sm text-ink-soft">
              <CircleCheck size={18} className="text-up" />
              {t('stock.allGood')}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {alerts.slice(0, 5).map(({ product, onHand, status }) => (
                <li key={product.id} className="flex min-h-12 items-center gap-3 px-4 py-2">
                  <span className="min-w-0 flex-1 truncate text-[15px]">{productLabel(product)}</span>
                  <span className="tnum text-sm text-ink-soft">{t('stock.left', { qty: formatQty(Math.max(0, onHand)) })}</span>
                  <span
                    aria-hidden
                    className={cn('h-2.5 w-2.5 shrink-0 rounded-full', status === 'out' ? 'bg-loss' : 'bg-debt')}
                    title={status === 'out' ? t('stock.outBadge') : t('stock.lowBadge')}
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}

      <Panel title={t('top.title')} aside={<span className="text-xs text-ink-faint">{t(`periods.${period}`)}</span>}>
        {data.top.length === 0 ? (
          <p className="px-4 py-5 text-sm text-ink-soft">{t('noSales')}</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-ink-faint">
                <th className="py-2 pl-4 font-medium">{t('top.product')}</th>
                <th className="py-2 pr-2 text-right font-medium">{t('top.qty')}</th>
                <th className="py-2 pr-4 text-right font-medium">{t('top.value')}</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((row) => (
                <tr key={row.productId} className="border-t border-line align-top">
                  <td className="py-2.5 pl-4">
                    <span className="line-clamp-1 text-[15px]">{row.name}</span>
                    <span aria-hidden className="mt-1.5 block h-1 rounded-full bg-line">
                      <span className="block h-1 rounded-full bg-brand" style={{ width: `${(row.total / topMax) * 100}%` }} />
                    </span>
                  </td>
                  <td className="tnum py-2.5 pr-2 text-right text-sm text-ink-soft">{formatQty(row.qty)}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <Money value={row.total} className="text-[15px] font-semibold" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title={t('recent.title')} footer={{ href: '/mauzo/historia', label: t('recent.all') }}>
        {data.recent.length === 0 ? (
          <p className="px-4 py-5 text-sm text-ink-soft">{t('noSales')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.recent.map((sale) => (
              <li key={sale.id} className="flex min-h-14 items-center gap-3 px-4 py-2">
                <span className="tnum w-11 shrink-0 text-sm text-ink-faint">
                  {new Date(sale.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dar_es_Salaam' })}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{t('recent.items', { count: sale.items })}</span>
                  {sale.seller ? <span className="block truncate text-xs text-ink-faint">{sale.seller}</span> : null}
                </span>
                <span className="text-right">
                  <Money value={sale.total} className="block font-semibold" />
                  <span className={cn('block text-xs', sale.method === 'credit' ? 'text-debt' : 'text-ink-faint')}>
                    {sale.method === 'split' ? t('recent.split') : tp(sale.method)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {show('staff') && can('viewStaffSales') && data.sellers.length > 1 ? (
        <Panel title={t('staff.title')} footer={{ href: '/wafanyakazi/mauzo', label: t('staff.all') }}>
          <ul className="divide-y divide-line">
            {data.sellers.map((seller) => (
              <li key={seller.id || 'none'} className="px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[15px]">{seller.name ?? t('staff.unknown')}</span>
                  <Money value={seller.total} className="font-semibold" />
                </div>
                <span aria-hidden className="mt-1.5 block h-1 rounded-full bg-line">
                  <span className="block h-1 rounded-full bg-brand" style={{ width: `${(seller.total / sellerMax) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="h-6" />
    </>
  );
}

/** One cell of the figures block: a label, the amount, and a line under it. */
function Figure({
  label,
  value,
  tone = 'plain',
  top = false,
  divider = false,
  href,
  children,
}: {
  label: string;
  value: number;
  tone?: 'plain' | 'loss' | 'debt';
  top?: boolean;
  divider?: boolean;
  href?: string;
  children?: ReactNode;
}) {
  const body = (
    <>
      <span className="block text-[13px] font-medium text-ink-soft">{label}</span>
      <Money
        value={value}
        className={cn('mt-1 block text-[21px] leading-tight font-bold', tone === 'loss' && 'text-loss', tone === 'debt' && 'text-debt')}
      />
      <span className="mt-1.5 block">{children}</span>
    </>
  );
  const frame = cn('block min-w-0 px-4 py-3', top && 'border-t border-line', divider && 'border-l border-line');
  return href ? (
    <Link href={href} prefetch={false} className={cn(frame, 'active:bg-paper')}>
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}

/** A small labelled amount in a row of three. */
function Cell({ label, value, sign }: { label: string; value: number; sign?: '+' | '-' }) {
  return (
    <div className="border-l border-line px-3 py-2.5 first:border-l-0">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className={cn('tnum mt-0.5 font-semibold', sign === '+' && 'text-up', sign === '-' && 'text-down')}>
        {sign && value > 0 ? sign : ''}
        <Money value={value} />
      </dd>
    </div>
  );
}

function Pill({ tone, children }: { tone: 'loss' | 'debt'; children: ReactNode }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', tone === 'loss' ? 'bg-loss-tint text-loss' : 'bg-debt-tint text-debt')}>
      {children}
    </span>
  );
}
