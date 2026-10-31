'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useApp } from '@/components/app-provider';
import { Plus, Trash2 } from '@/components/icons';
import { PageHeader } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { checkSplit, DEFAULT_SPLIT, splitOf, type SplitBucket } from '@/lib/calc/profit-split';
import { cn } from '@/lib/cn';
import { saveProfitSplit } from '@/lib/local/actions';
import { uuidv7 } from '@/lib/uuid';

/** "Mgawanyo wa faida": the owner sets where each shilling of profit goes. */
export default function SplitPage() {
  const t = useTranslations('daftari.split');
  const toast = useToast();
  const router = useRouter();
  const { business, businessId } = useApp();
  const [buckets, setBuckets] = useState<SplitBucket[] | null>(null);
  const rows = buckets ?? splitOf(business?.settings.profitSplit);

  const update = (id: string, patch: Partial<SplitBucket>) => setBuckets(rows.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const total = rows.reduce((sum, b) => sum + (Number.isFinite(b.pct) ? b.pct : 0), 0);
  const problem = checkSplit(rows);

  const save = async () => {
    if (!businessId || problem) return;
    await saveProfitSplit(businessId, rows);
    toast(t('saved'));
    router.back();
  };

  return (
    <>
      <PageHeader title={t('editTitle')} subtitle={t('editHint')} />
      <div className="space-y-3 p-3">
        <ul className="card divide-y divide-line">
          {rows.map((bucket) => (
            <li key={bucket.id} className="flex items-center gap-2 p-3">
              {bucket.key ? (
                <span className="min-w-0 flex-1 font-semibold">{t(`keys.${bucket.key}`)}</span>
              ) : (
                <TextInput
                  aria-label={t('name')}
                  className="min-w-0 flex-1"
                  value={bucket.label ?? ''}
                  onChange={(e) => update(bucket.id, { label: e.target.value })}
                />
              )}
              <TextInput
                aria-label={t('percent')}
                inputMode="decimal"
                className="w-20 text-right"
                value={Number.isFinite(bucket.pct) ? String(bucket.pct) : ''}
                onChange={(e) => update(bucket.id, { pct: e.target.value.trim() === '' ? 0 : Number(e.target.value.replace(',', '.')) })}
              />
              <span className="text-ink-soft">%</span>
              <button
                aria-label={t('remove')}
                onClick={() => setBuckets(rows.filter((b) => b.id !== bucket.id))}
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink-faint active:bg-line/40"
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setBuckets([...rows, { id: uuidv7(), label: '', pct: 0 }])}>
            <Plus size={18} />
            {t('add')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setBuckets(DEFAULT_SPLIT.map((b) => ({ ...b })))}>
            {t('reset')}
          </Button>
        </div>

        <p className={cn('text-center text-lg font-bold', problem ? 'text-loss' : 'text-brand')}>{t('total', { pct: Math.round(total * 10) / 10 })}</p>
        {problem ? <p className="text-center text-sm text-loss">{t(`problems.${problem}`)}</p> : null}

        <Button size="xl" block disabled={problem !== null} onClick={() => void save()}>
          {t('save')}
        </Button>
      </div>
    </>
  );
}
