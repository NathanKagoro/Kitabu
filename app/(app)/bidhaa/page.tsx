'use client';

import { ChevronRight, ClipboardCheck, Package, Plus, Search, ShoppingCart, Trash } from '@/components/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { useApp } from '@/components/app-provider';
import { Badge, EmptyState, Money, PageHeader } from '@/components/ui/bits';
import { TextInput } from '@/components/ui/field';
import { Segmented } from '@/components/ui/segmented';
import { inventoryValue } from '@/lib/calc/dashboard';
import { averageUnitCost, isLowStock } from '@/lib/calc/stock';
import { cn } from '@/lib/cn';
import { IS_DAFTARI } from '@/lib/edition';
import { db } from '@/lib/local/db';
import { useProducts, useStock } from '@/lib/local/queries';
import { groupByCategory, matchesQuery } from '@/lib/products';
import type { StockMovement } from '@/lib/types';
import { formatQty } from '@/lib/units';

type Filter = 'all' | 'low' | 'out';

/**
 * The stock room (Kitabu's "Stoo" tab): what the shelves are worth at cost,
 * how many lines are running low or out, the jobs that change stock (buy,
 * count, losses), and every product grouped by category with its quantity.
 * Search covers name, shade/size, category and barcode. ?onyesha=low|out
 * opens on that filter (the dashboard links here).
 */
export default function ProductsPage() {
  const t = useTranslations('products');
  const ti = useTranslations('inventory');
  const ts = useTranslations('stockCheck');
  const { businessId, show, can } = useApp();
  const products = useProducts(businessId);
  const stock = useStock(businessId);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('onyesha');
    // The link's filter is read once the page is in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (wanted === 'low' || wanted === 'out') setFilter(wanted);
  }, []);
  const tracking = show('stockTracking');

  // Average buying cost per product, from the stock ledger.
  const costs = useLiveQuery(async () => {
    if (!businessId) return new Map<string, number | null>();
    const rows = await db().stockMovements.where('businessId').equals(businessId).toArray();
    const byProduct = new Map<string, StockMovement[]>();
    for (const row of rows) byProduct.set(row.productId, [...(byProduct.get(row.productId) ?? []), row]);
    return new Map([...byProduct].map(([id, list]) => [id, averageUnitCost(list)]));
  }, [businessId]);

  const levelOf = (p: { id: string; trackStock: boolean; lowStockLevel?: number | null }): Filter | null => {
    if (!p.trackStock || !tracking) return null;
    const onHand = stock?.get(p.id) ?? 0;
    return onHand <= 0 ? 'out' : isLowStock(onHand, p.lowStockLevel) ? 'low' : 'all';
  };
  const live = (products ?? []).filter((p) => p.active);
  const outCount = live.filter((p) => levelOf(p) === 'out').length;
  const lowCount = live.filter((p) => levelOf(p) === 'low').length;
  const worth = inventoryValue(
    live.filter((p) => p.trackStock).map((p) => ({ onHand: stock?.get(p.id) ?? 0, unitCost: costs?.get(p.id) ?? p.cost ?? null }))
  );

  const groups = useMemo(
    () =>
      groupByCategory(
        (products ?? []).filter((p) => matchesQuery(p, query) && (filter === 'all' || levelOf(p) === filter))
      ),
    // levelOf reads stock and tracking, both listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, query, filter, stock, tracking]
  );
  const showHeadings = groups.length > 1 || groups[0]?.category != null;

  const jobs = [
    { href: '/manunuzi', label: ti('actions.buy'), Icon: ShoppingCart, ok: can('recordPurchase') },
    { href: '/stoo', label: ti('actions.count'), Icon: ClipboardCheck, ok: can('countStock') && tracking },
    { href: '/hasara', label: ti('actions.waste'), Icon: Trash, ok: can('manageProducts') && show('waste') },
    { href: '/bidhaa/ingiza', label: ti('actions.bulk'), Icon: Package, ok: can('manageProducts') },
  ].filter((j) => j.ok);

  return (
    <>
      <PageHeader
        back={IS_DAFTARI}
        title={IS_DAFTARI ? t('title') : ti('title')}
        subtitle={products?.length ? t('count', { count: products.length }) : undefined}
        action={
          can('manageProducts') ? (
            <Link href="/bidhaa/mpya" aria-label={t('add')} className="flex h-12 w-12 items-center justify-center rounded-full text-brand active:bg-line/40">
              <Plus size={26} />
            </Link>
          ) : null
        }
      />

      {tracking && live.length > 0 ? (
        <section className="mx-3 mt-3 overflow-hidden rounded-[12px] border border-line bg-surface" aria-label={ti('valueLabel')}>
          <div className="px-4 pt-3.5 pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[13px] font-medium text-ink-soft">{ti('valueLabel')}</p>
              <p className="text-xs text-ink-faint">{ti('valueHint')}</p>
            </div>
            <Money value={worth.value} symbol className="mt-1 block text-[28px] leading-tight font-bold" />
            {worth.uncosted > 0 ? <p className="mt-1 text-xs text-ink-faint">{ti('uncosted', { count: worth.uncosted })}</p> : null}
          </div>
          <div className="grid grid-cols-3 border-t border-line">
            {(
              [
                { key: 'all', label: ti('inStock'), value: live.filter((p) => p.trackStock).length - outCount, tone: '' },
                { key: 'low', label: ti('low'), value: lowCount, tone: lowCount ? 'text-debt' : '' },
                { key: 'out', label: ti('out'), value: outCount, tone: outCount ? 'text-loss' : '' },
              ] as const
            ).map((cell, i) => (
              <button
                key={cell.key}
                onClick={() => setFilter(cell.key)}
                aria-pressed={filter === cell.key}
                className={cn(
                  'px-3 py-2.5 text-left active:bg-paper',
                  i > 0 && 'border-l border-line',
                  filter === cell.key && 'bg-brand-tint'
                )}
              >
                <span className="block text-xs text-ink-faint">{cell.label}</span>
                <span className={cn('tnum block text-xl font-bold', cell.tone)}>{cell.value}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {jobs.length ? (
        <nav className="mx-3 mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${jobs.length}, minmax(0, 1fr))` }} aria-label={ts('title')}>
          {jobs.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-[12px] border border-line bg-surface px-1 text-center text-[13px] leading-tight font-semibold active:bg-paper"
            >
              <Icon size={21} className="text-brand" />
              {label}
            </Link>
          ))}
        </nav>
      ) : null}

      {tracking && live.length > 0 ? (
        <div className="px-3 pt-3">
          <Segmented
            label={ti('filter')}
            value={filter}
            onChange={setFilter}
            options={(['all', 'low', 'out'] as const).map((f) => ({ value: f, label: ti(`filters.${f}`) }))}
          />
        </div>
      ) : null}

      {(products?.length ?? 0) > 8 && (
        <div className="relative px-3 pt-3">
          <Search size={18} className="absolute top-1/2 left-6 mt-1.5 -translate-y-1/2 text-ink-faint" />
          <TextInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className="h-12 pl-10"
          />
        </div>
      )}

      {products && products.length === 0 ? <EmptyState icon={<Package size={44} />} title={t('empty')} /> : null}

      {groups.map((group) => (
        <section key={group.category ?? '__none'} className="pt-3">
          {showHeadings && (
            <h2 className="px-4 pb-1 text-sm font-bold text-ink-soft">{group.category ?? t('noCategory')}</h2>
          )}
          <ul className="divide-y divide-line border-y border-line bg-surface">
            {group.items.map((product) => {
              const onHand = stock?.get(product.id) ?? 0;
              const tracked = product.trackStock && show('stockTracking');
              return (
                <li key={product.id}>
                  <Link href={`/bidhaa/hariri?id=${product.id}`} className="flex min-h-16 items-center gap-3 px-4 py-2 active:bg-paper">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {product.name}
                        {product.variant ? <span className="font-normal text-ink-soft"> · {product.variant}</span> : null}
                      </span>
                      <span className="text-sm text-ink-faint">
                        <Money value={product.price} /> / {product.unit === 'custom' ? product.unitLabel : t(`unitsShort.${product.unit}`)}
                      </span>
                    </span>
                    {tracked ? (
                      onHand <= 0 ? (
                        <Badge tone="loss">{t('outOfStock')}</Badge>
                      ) : isLowStock(onHand, product.lowStockLevel) ? (
                        <Badge tone="debt">
                          {t('lowStock')} · {formatQty(onHand)}
                        </Badge>
                      ) : (
                        <Badge>{formatQty(onHand)}</Badge>
                      )
                    ) : null}
                    <ChevronRight size={20} className="shrink-0 text-ink-faint" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {products && products.length > 0 && groups.length === 0 ? (
        <p className="p-6 text-center text-ink-soft">{filter === 'all' ? t('noMatch') : ti('noneInFilter')}</p>
      ) : null}
    </>
  );
}
