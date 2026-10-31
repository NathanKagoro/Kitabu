'use client';

import { useTranslations } from 'next-intl';

import { OptionGrid } from '@/components/ui/bits';
import { SPEND_SOURCES, type SpendMethod } from '@/lib/types';

type Source = (typeof SPEND_SOURCES)[number];

/**
 * "Where did the money come from?" for purchases and expenses. Only the shop's
 * cash comes off the cash expected in the tin; the owner's own pocket, mobile
 * money and the bank don't, which is what keeps the daily count honest.
 */
export function MoneySourcePicker({
  value,
  onChange,
  sources = SPEND_SOURCES,
}: {
  value: SpendMethod;
  onChange: (value: Source) => void;
  sources?: readonly Source[];
}) {
  const t = useTranslations('money');
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-ink-soft">{t('sourceLabel')}</p>
      <OptionGrid<Source>
        value={value as Source}
        onChange={onChange}
        columns={2}
        options={sources.map((s) => ({ value: s, label: t(`sources.${s}`) }))}
      />
      <p className="text-xs text-ink-faint">{t('sourceHint')}</p>
    </div>
  );
}
