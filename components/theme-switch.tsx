'use client';

import { useTranslations } from 'next-intl';

import { Segmented } from '@/components/ui/segmented';
import { setThemePreference, useTheme, type ThemePreference } from '@/lib/theme';

const OPTIONS: readonly ThemePreference[] = ['light', 'dark', 'system'];

/** Light (the default), dark, or follow the phone. A per-phone choice, open to everyone. */
export function ThemeSwitch() {
  const t = useTranslations('more.theme');
  const { preference } = useTheme();
  return (
    <section className="card mx-3 mt-4 p-4">
      <p className="font-label mb-2 text-[15px] text-ink-soft">{t('title')}</p>
      <Segmented
        label={t('title')}
        value={preference}
        onChange={setThemePreference}
        options={OPTIONS.map((o) => ({ value: o, label: t(o) }))}
      />
    </section>
  );
}
