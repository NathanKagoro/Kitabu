'use client';

import { productLabel } from '@/lib/products';
import { useLiveQuery } from 'dexie-react-hooks';
import { Info, Lock, TriangleAlert } from '@/components/icons';
import { WithdrawSheet } from '@/components/summary/withdraw-sheet';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useApp } from '@/components/app-provider';
import { BarChart } from '@/components/summary/bar-chart';
import { Money, PageHeader, Row } from '@/components/ui/bits';
import { Segmented } from '@/components/ui/segmented';
import { Button } from '@/components/ui/button';
import { Keypad, parseKeypad } from '@/components/ui/keypad';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { cashDifference, salesByDay, summariseDay, topProducts } from '@/lib/calc/summary';
import { cn } from '@/lib/cn';
import { addDays, businessDay, recentDays } from '@/lib/date';
import { closeDay, openingCashFor } from '@/lib/local/actions';
import { db } from '@/lib/local/db';
import { loadRange } from '@/lib/local/queries';
import { formatTZS } from '@/lib/money';
import { formatQty } from '@/lib/units';

export default function SummaryPage() {
  const t = useTranslations('summary');
  const toast = useToast();
  const { businessId, userId, can } = useApp();
  const [range, setRange] = useState<7 | 30>(7);
  const [closing, setClosing] = useState(false);
  const [counted, setCounted] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const today = businessDay();

  const data = useLiveQuery(async () => {
    if (!businessId) return null;
    const [todayRows, openingCash, todayClose] = await Promise.all([
      loadRange(businessId, today, today),
      openingCashFor(businessId, today),
      db().dayClosings.where('[businessId+date]').equals([businessId, today]).first(),
    ]);
    return {
      openingCash,
      todayClose: todayClose ?? null,
      summary: summariseDay({ ...todayRows, openingCash }),
    };
  }, [businessId, today]);

  const history = useLiveQuery(async () => {
    if (!businessId) return null;
    const days = recentDays(range, today);
    const rows = await loadRange(businessId, addDays(today, -(range - 1)), today);
    const live = new Set(rows.sales.filter((s) => s.status === 'complete').map((s) => s.id));
    const points = salesByDay(rows.sales, days, (s) => businessDay(s.clientCreatedAt));
    const top = topProducts(rows.saleLines.filter((l) => live.has(l.saleId)), 5);
    const products = await db().products.bulkGet(top.map((p) => p.productId));
    return { points, top: top.map((p, i) => ({ ...p, name: products[i] ? productLabel(products[i]) : '—' })) };
  }, [businessId, today, range]);

  if (!data) return <PageHeader title={t('title')} />;
  const { summary, openingCash, todayClose } = data;
  const countedValue = Math.round(parseKeypad(counted));
  const difference = cashDifference(summary.expectedCash, countedValue);
  const total = history?.points.reduce((s, p) => s + p.total, 0) ?? 0;
  const best = history?.points.reduce((a, b) => (b.total > a.total ? b : a), { day: '', total: 0 });

  const saveClose = async () => {
    if (!businessId) return;
    await closeDay({ businessId, userId, day: today, openingCash, expectedCash: summary.expectedCash, countedCash: countedValue });
    toast(t('closed'));
    setClosing(false);
  };

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={new Date().toLocaleDateString('sw-TZ', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Dar_es_Salaam' })}
      />

      {/* The day's takings: gold on black in Kitabu, the one loud thing on the screen. */}
      <section className="m-3 overflow-hidden rounded-[14px] bg-band text-band-ink">
        <div className="px-5 pt-4 pb-4">
          <p className="font-label text-[15px] text-band-soft">{t('salesTotal')}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-label text-lg text-band-soft">TSh</span>
            <Money value={summary.salesTotal} className="font-display text-[44px] leading-none text-accent" />
          </p>
          <p className="mt-1.5 text-sm text-band-soft">{t('salesCount', { count: summary.salesCount })}</p>
        </div>
        <dl className="grid grid-cols-3 border-t border-band-line">
          {[
            { label: t('cash'), value: summary.cash },
            { label: t('mobile'), value: summary.mobile + summary.bank },
            { label: t('credit'), value: summary.credit },
          ].map((item, i) => (
            <div key={item.label} className={cn('px-3 py-3', i > 0 && 'border-l border-band-line')}>
              <dt className="font-label text-[13px] text-band-soft">{item.label}</dt>
              <dd>
                <Money value={item.value} className="font-display text-xl" />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {can('viewProfit') && (
        <section className="card mx-3 mb-3 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-label text-[17px]">{t('profit')}</h2>
            <span className="text-xs text-ink-faint">{t('profitEstimate')}</span>
          </div>
          <Money
            value={summary.estimatedProfit}
            symbol
            className={cn('mt-1 block font-display text-[36px] leading-tight', summary.estimatedProfit < 0 ? 'text-loss' : 'text-brand')}
          />
          <p className="mt-1 text-sm text-ink-soft">
            {t('costOfGoods')} <Money value={summary.costOfGoodsSold} className="font-semibold text-ink" />
          </p>
          {summary.profitIsPartial ? (
            <p className="mt-2 flex gap-1.5 text-xs text-ink-soft">
              <Info size={14} className="mt-0.5 shrink-0" />
              {t('profitPartial')}
            </p>
          ) : null}
        </section>
      )}

      <section className="card mx-3 mb-3 px-4 pt-3 pb-1">
        <h2 className="font-label text-[17px]">{t('moneyMoves')}</h2>
        <Row label={t('debtCollected')} value={<Money value={summary.debtCollected} signed />} tone="brand" />
        <Row label={t('expenses')} value={<Money value={-summary.expensesTotal} />} tone="loss" />
        <Row label={t('purchases')} value={<Money value={-summary.purchasesTotal} />} tone="soft" />
        <Row label={t('waste')} value={<Money value={-summary.wasteTotal} />} tone="loss" />
        {summary.withdrawalsTotal > 0 && can('withdrawCash') ? (
          <Row label={t('withdrawals')} value={<Money value={-summary.withdrawalsTotal} />} tone="soft" />
        ) : null}
      </section>

      <section className="card mx-3 mb-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-label text-[17px]">{t('expectedCash')}</h2>
          {todayClose ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand-dark">
              <Lock size={12} />
              {t('closed')}
            </span>
          ) : null}
        </div>
        <Money value={summary.expectedCash} symbol className={cn('mt-1 block font-display text-[36px] leading-tight', summary.expectedCash < 0 && 'text-loss')} />
        <div className="mt-2 border-t border-line">
          <Row label={t('openingCash')} value={<Money value={openingCash} />} tone="soft" />
          <Row label={t('cashIn')} value={<Money value={summary.cashIn} signed />} tone="brand" />
          <Row label={t('cashSpent')} value={<Money value={-summary.cashSpent} />} tone="loss" />
          {summary.cashWithdrawals > 0 ? (
            <Row label={t('withdrawals')} value={<Money value={-summary.cashWithdrawals} />} tone="soft" />
          ) : null}
          {todayClose ? (
            <Row label={t('countedLabel')} value={<Money value={todayClose.countedCash} />} strong />
          ) : null}
        </div>
        {summary.expectedCash < 0 ? (
          <p className="mt-2 flex gap-1.5 rounded-[10px] bg-loss-tint px-3 py-2 text-sm text-loss" role="status">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            {t('negativeCash')}
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {can('closeDay') && (
            <Button
              size="lg"
              variant={todayClose ? 'secondary' : 'primary'}
              className={cn('whitespace-nowrap px-3', !can('withdrawCash') && 'col-span-2')}
              onClick={() => {
                setCounted(todayClose ? String(todayClose.countedCash) : '');
                setClosing(true);
              }}
            >
              <Lock size={18} />
              {t('closeDay')}
            </Button>
          )}
          {can('withdrawCash') && (
            <Button size="lg" variant="secondary" className={cn(!can('closeDay') && 'col-span-2')} onClick={() => setWithdrawing(true)}>
              {t('withdrawButton')}
            </Button>
          )}
        </div>
      </section>

      <section className="card mx-3 mb-3 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-label min-w-0 text-[17px] leading-tight">{t('salesByDay')}</h2>
          <Segmented
            className="w-40 shrink-0"
            label={t('salesByDay')}
            value={String(range) as '7' | '30'}
            onChange={(v) => setRange(v === '7' ? 7 : 30)}
            options={[
              { value: '7', label: t('last7') },
              { value: '30', label: t('last30') },
            ]}
          />
        </div>
        {history ? <BarChart points={history.points} today={today} /> : <div className="h-40" />}
        <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <div>
            <dt className="text-sm text-ink-soft">{t('average')}</dt>
            <dd>
              <Money value={Math.round(total / range)} className="font-display text-xl" />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-soft">{t('best')}</dt>
            <dd>
              <Money value={best?.total ?? 0} className="font-display text-xl" />
            </dd>
          </div>
        </dl>
      </section>

      {history && history.top.length > 0 && (
        <section className="card mx-3 mb-3 p-4">
          <h2 className="font-label text-[17px]">{t('topProducts')}</h2>
          {/* A ranking, so it is numbered. */}
          <ol className="mt-2 divide-y divide-line">
            {history.top.map((p, i) => (
              <li key={p.productId} className="flex items-center gap-3 py-2.5">
                <span className="w-5 font-display text-lg text-ink-faint">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="text-xs text-ink-faint">{formatQty(p.qty)}</span>
                </span>
                <Money value={p.total} className="font-semibold" />
              </li>
            ))}
          </ol>
        </section>
      )}

      <WithdrawSheet open={withdrawing} onClose={() => setWithdrawing(false)} />

      <Sheet open={closing} onClose={() => setClosing(false)} title={t('closeDayTitle', { date: today })}>
        <div className="space-y-4 p-4">
          {todayClose ? <p className="text-sm text-debt">{t('reopenHint')}</p> : null}
          <Row label={t('expectedLabel')} value={<Money value={summary.expectedCash} />} strong />
          <p className="text-sm font-semibold text-ink-soft">{t('countedLabel')}</p>
          <p className="tnum text-center text-4xl font-bold">{formatTZS(countedValue)}</p>
          {counted !== '' && (
            <p className={cn('text-center text-lg font-bold', difference === 0 ? 'text-brand' : difference > 0 ? 'text-info' : 'text-loss')}>
              {difference === 0 ? t('exact') : `${difference > 0 ? t('over') : t('short')}: ${formatTZS(Math.abs(difference))}`}
            </p>
          )}
          <Keypad value={counted} onChange={setCounted} />
          <Button size="xl" block disabled={counted === ''} onClick={() => void saveClose()}>
            {t('closeDay')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
