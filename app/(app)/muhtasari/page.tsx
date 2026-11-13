'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';

import { useApp } from '@/components/app-provider';
import { ShopLogo } from '@/components/brand/shop-logo';
import { ArrowDownRight, ArrowUpRight, ChevronRight, CircleCheck, Lock, Receipt, ShoppingCart } from '@/components/icons';
import { BarChart } from '@/components/summary/bar-chart';
import { SyncIndicator } from '@/components/sync-indicator';
import { Money } from '@/components/ui/bits';
import { Segmented } from '@/components/ui/segmented';
import { marginPercent, percentChange, stockAlerts } from '@/lib/calc/dashboard';
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

  // A curved navy header with the shop and the period; the day's sales on a white card that overlaps it.
  const top = (
    <header className="rounded-b-[28px] bg-band px-4 pt-3 pb-16 text-band-ink">
      <div className="flex items-center gap-2.5">
        {business?.settings.logoUrl ? <ShopLogo src={business.settings.logoUrl} size={32} className="rounded-[10px] bg-surface" /> : null}
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-[26px] leading-none uppercase">{business?.name ?? t('title')}</h1>
          <p className="mt-1 truncate text-[13px] text-band-soft">{dateLine}</p>
        </div>
        <div className="band-action flex shrink-0 items-center">
          <SyncIndicator />
        </div>
      </div>
      <Segmented
        className="seg-dark mt-4"
        label={t('periodLabel')}
        value={period}
        onChange={setPeriod}
        options={PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) }))}
      />
    </header>
  );
  if (!data) return top;

  const { now, then, drawer } = data;
  const owed = customers?.reduce((sum, c) => sum + Math.max(0, c.balance), 0) ?? 0;
  const owing = customers?.filter((c) => c.balance > 0).length ?? 0;
  const alerts = products && stock ? stockAlerts(products, stock) : [];
  const outCount = alerts.filter((a) => a.status === 'out').length;
  const lowCount = alerts.length - outCount;
  const weekTotal = data.thisWeek.reduce((s, p) => s + p.total, 0);
  // A usual day: the average of the seven days before today.
  const usual = Math.round([...data.lastWeek, ...data.thisWeek].slice(6, 13).reduce((s, p) => s + p.total, 0) / 7);
  // What today, this week or this month is measured against: a usual day, last week, last month.
  const target = period === 'today' ? usual : then.salesTotal;
  const progress = target > 0 ? now.salesTotal / target : null;
  const change = percentChange(now.salesTotal, then.salesTotal);
  const showProfit = can('viewProfit');

  const jobs = [
    { href: '/manunuzi', label: t('actions.buy'), Icon: ShoppingCart, ok: can('recordPurchase') },
    { href: '/matumizi', label: t('actions.expense'), Icon: Receipt, ok: can('recordExpense') && show('expenses') },
    { href: '/hesabu', label: t('actions.close'), Icon: Lock, ok: can('closeDay') },
  ].filter((a) => a.ok);

  return (
    <>
      {top}

      <section className="relative mx-3 -mt-12 rounded-[24px] bg-surface px-[18px] pt-4 pb-[18px]" aria-label={t('kpi.sales')}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-bold text-ink-soft">{t('kpi.sales')}</p>
          <p className="tnum text-[13px] text-ink-faint">{t('kpi.salesCount', { count: now.salesCount })}</p>
        </div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-[24px]">TSh</span>
            <Money value={now.salesTotal} className="font-display text-[60px] leading-[0.9]" />
          </p>
          {change !== null ? (
            <span
              className={cn(
                'tnum mb-1 inline-flex shrink-0 items-center gap-0.5 rounded-full px-2.5 py-1 text-sm font-bold',
                change >= 0 ? 'bg-up/12 text-up' : 'bg-down/10 text-down'
              )}
            >
              {change >= 0 ? <ArrowUpRight size={15} strokeWidth={2.6} /> : <ArrowDownRight size={15} strokeWidth={2.6} />}
              {Math.abs(change)}%
            </span>
          ) : null}
        </div>
        {progress !== null ? (
          <div className="mt-4">
            <div className="h-3 overflow-hidden rounded-full bg-paper">
              <div
                className={cn('h-full rounded-full', progress >= 1 ? 'bg-up' : 'bg-band')}
                style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between gap-3 text-[13px]">
              <span className="text-ink-faint">
                {t(`hero.against.${period}`)} <Money value={target} className="font-semibold text-ink-soft" />
              </span>
              <span className={cn('tnum font-bold', progress >= 1 ? 'text-up' : 'text-ink-soft')}>{Math.round(progress * 100)}%</span>
            </div>
          </div>
        ) : null}
      </section>

      {can('sell') ? (
        <Link
          href="/mauzo"
          prefetch={false}
          className="font-display mx-3 mt-3 flex h-16 items-center justify-center rounded-[20px] bg-sell text-[32px] tracking-[0.05em] text-white uppercase shadow-[0_5px_0_var(--color-sell-dark)] active:translate-y-[3px] active:shadow-[0_2px_0_var(--color-sell-dark)]"
        >
          {t('actions.sell')}
        </Link>
      ) : null}

      {jobs.length ? (
        <nav aria-label={t('actions.title')} className="mx-3 mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${jobs.length}, minmax(0, 1fr))` }}>
          {jobs.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-surface px-2 text-[13.5px] leading-tight font-bold active:bg-brand-tint"
            >
              <Icon size={18} className="shrink-0" />
              <span className="min-w-0">{label}</span>
            </Link>
          ))}
        </nav>
      ) : null}

      {/* The figures as painted panels: one colour each, a big number, one word. */}
      <section className="mx-3 mt-3 grid grid-cols-2 gap-2" aria-label={t('figures')}>
        {showProfit ? (
          <Tile tone="navy" label={t('tiles.profit')} value={now.estimatedProfit} note={marginPercent(now.estimatedProfit, now.salesTotal) === null ? null : `${marginPercent(now.estimatedProfit, now.salesTotal)}%`} />
        ) : (
          <Tile tone="navy" label={t('tiles.cash')} value={now.cash} />
        )}
        <Tile tone="sign" label={t('tiles.owed')} value={owed} note={t('tiles.people', { count: owing })} href="/madeni" />
        <Tile label={t('tiles.drawer')} value={drawer.expectedCash} note={data.closed ? t('tiles.closed') : t('tiles.open')} href="/hesabu" />
        <Tile label={t('tiles.spent')} value={now.expensesTotal} />
      </section>

      {show('stockTracking') ? (
        <Section title={t('sections.restock')} more={alerts.length ? { href: `/bidhaa?onyesha=${outCount ? 'out' : 'low'}`, label: t('stock.all') } : undefined}>
          {alerts.length === 0 ? (
            <p className="flex min-h-12 items-center gap-2 px-4 text-[15px] font-semibold">
              <CircleCheck size={18} className="text-up" />
              {t('stock.allGood')}
            </p>
          ) : (
            alerts.slice(0, 4).map(({ product, onHand, status }) => (
              <Row key={product.id} edge={status === 'out' ? 'loss' : 'debt'} label={productLabel(product)}>
                <span className={cn('font-display text-[22px]', status === 'out' ? 'text-loss' : 'text-debt')}>
                  {status === 'out' ? t('stock.outBadge') : t('stock.left', { qty: formatQty(onHand) })}
                </span>
              </Row>
            ))
          )}
          {lowCount + outCount > 4 ? <p className="px-4 pb-2 text-xs text-ink-faint">{t('stock.more', { count: lowCount + outCount - 4 })}</p> : null}
        </Section>
      ) : null}

      <Section title={t('sections.week')} aside={<Money value={weekTotal} symbol className="text-sm font-bold" />}>
        <div className="px-4 pt-3 pb-3">
          <BarChart
            points={data.thisWeek}
            today={today}
            usual={usual > 0 ? usual : undefined}
            labels={{ usual: t('chart.usual'), best: t('chart.best'), vsUsual: t('chart.vsUsual') }}
          />
        </div>
      </Section>

      <Section title={t('sections.top')}>
        {data.top.length === 0 ? (
          <p className="flex min-h-12 items-center px-4 text-[15px] text-ink-soft">{t('noSales')}</p>
        ) : (
          data.top.slice(0, 3).map((row) => (
            <Row key={row.productId} label={row.name} sub={`× ${formatQty(row.qty)}`}>
              <Money value={row.total} className="font-display text-[22px]" />
            </Row>
          ))
        )}
      </Section>

      <Section title={t('sections.recent')} more={{ href: '/mauzo/historia', label: t('recent.all') }}>
        {data.recent.length === 0 ? (
          <p className="flex min-h-12 items-center px-4 text-[15px] text-ink-soft">{t('noSales')}</p>
        ) : (
          data.recent.slice(0, 3).map((sale) => (
            <Row
              key={sale.id}
              edge={sale.method === 'credit' ? 'debt' : undefined}
              label={new Date(sale.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dar_es_Salaam' })}
              sub={[t('recent.items', { count: sale.items }), sale.seller].filter(Boolean).join(', ')}
            >
              <Money value={sale.total} className="font-display text-[22px]" />
            </Row>
          ))
        )}
      </Section>

      {show('staff') && can('viewStaffSales') && data.sellers.length > 1 ? (
        <Section title={t('sections.sellers')} more={{ href: '/wafanyakazi/mauzo', label: t('staff.all') }}>
          {data.sellers.map((seller) => (
            <Row key={seller.id || 'none'} label={seller.name ?? t('staff.unknown')}>
              <Money value={seller.total} className="font-display text-[22px]" />
            </Row>
          ))}
        </Section>
      ) : null}

      <div className="h-6" />
    </>
  );
}

/** A section: its name painted above, its rows on a white panel, and a link out when there is more. */
function Section({
  title,
  aside,
  more,
  children,
}: {
  title: string;
  aside?: ReactNode;
  more?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="mx-3 mt-6">
      <header className="mb-2.5 flex items-center gap-3 px-1">
        <h2 className="stripe-title font-display min-w-0 flex-1 text-[24px] leading-none uppercase">{title}</h2>
        {aside}
      </header>
      <div className="card overflow-hidden">
        {children}
        {more ? (
          <Link
            href={more.href}
            prefetch={false}
            className="flex min-h-12 items-center justify-between border-t border-line px-4 text-sm font-bold active:bg-paper"
          >
            {more.label}
            <ChevronRight size={18} />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

/** One line of a section: a coloured edge, a name, and its figure on the right. */
function Row({ label, sub, edge, children }: { label: string; sub?: string; edge?: 'loss' | 'debt'; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex min-h-14 items-center gap-3 border-b border-b-paper py-2 pr-4 pl-3 last:border-b-0',
        'border-l-[6px]',
        edge === 'loss' ? 'border-l-loss' : edge === 'debt' ? 'border-l-debt' : 'border-l-bar'
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{label}</span>
        {sub ? <span className="block truncate text-xs text-ink-faint">{sub}</span> : null}
      </span>
      {children}
    </div>
  );
}

/** A painted panel: one word, one big number, and at most a short note. */
function Tile({
  label,
  value,
  note,
  tone = 'plain',
  href,
}: {
  label: string;
  value: number;
  note?: string | null;
  tone?: 'plain' | 'navy' | 'sign';
  href?: string;
}) {
  const body = (
    <>
      <span className="block text-[13px] font-bold">{label}</span>
      <Money value={value} className={cn('font-display mt-1 block text-[38px] leading-none', value < 0 && 'text-loss')} />
      {note ? <span className="mt-1.5 block text-[13px] font-semibold opacity-80">{note}</span> : null}
    </>
  );
  const frame = cn(
    'block min-h-[104px] min-w-0 rounded-[20px] px-4 py-3.5',
    tone === 'navy' ? 'bg-hero text-band-ink' : tone === 'sign' ? 'bg-sign text-sign-ink' : 'bg-surface text-ink'
  );
  return href ? (
    <Link href={href} prefetch={false} className={cn(frame, 'active:opacity-85')}>
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}
