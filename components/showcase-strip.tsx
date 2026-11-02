'use client';

import { useTranslations } from 'next-intl';

import { withBase } from '@/lib/base-path';
import { IS_DAFTARI } from '@/lib/edition';

/** The demo strip itself (see showcase-bar.tsx): loaded only on the demo link. */
export function ShowcaseStrip() {
  const t = useTranslations('demo');
  return (
    <div className="flex min-h-10 items-center gap-2 bg-accent px-4 text-sm font-semibold text-band">
      <span className="min-w-0 flex-1 truncate">{t('banner')}</span>
      {IS_DAFTARI ? null : (
        // Kitabu's demo has four trades: back to the choice.
        <a href={withBase('/demo/?chagua=1')} className="flex h-8 shrink-0 items-center rounded-full border border-band/40 px-3 text-xs font-bold">
          {t('switch')}
        </a>
      )}
      <button
        className="h-8 shrink-0 rounded-full bg-band px-3 text-xs font-bold text-band-ink"
        onClick={() =>
          void (async () => {
            const { signOut } = await import('@/lib/auth/session');
            await signOut();
            window.location.replace(withBase('/ingia/'));
          })()
        }
      >
        {t('leave')}
      </button>
    </div>
  );
}
