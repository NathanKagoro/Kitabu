'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/cn';
import { setThemePreference, useTheme, type ThemePreference } from '@/lib/theme';

const OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** Light, dark, or follow the phone. A per-phone choice, open to everyone. */
export function ThemeSwitch() {
  const t = useTranslations('more.theme');
  const { preference } = useTheme();
  return (
    <section className="card mx-3 mt-4 p-4">
      <p className="mb-2 text-sm font-semibold text-ink-soft">{t('title')}</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('title')}>
        {OPTIONS.map((option) => (
          <button
            key={option}
            role="radio"
            aria-checked={preference === option}
            onClick={() => setThemePreference(option)}
            className={cn(
              'h-12 rounded-[10px] border text-sm font-semibold',
              preference === option ? 'border-brand bg-brand-tint text-brand-dark' : 'border-line-strong bg-surface text-ink-soft'
            )}
          >
            {t(option)}
          </button>
        ))}
      </div>
    </section>
  );
}
