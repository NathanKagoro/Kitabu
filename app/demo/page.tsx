'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { DemoPicker } from '@/components/demo/demo-picker';
import { Logo } from '@/components/brand/logo';
import { useSetLocale } from '@/components/locale-provider';
import { Button } from '@/components/ui/button';
import { withBase } from '@/lib/base-path';
import { HOME, IS_DAFTARI } from '@/lib/edition';
import { businessDay } from '@/lib/date';
import { demoShop, type DemoShop } from '@/lib/demo-shops';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { db, getMeta, META_KEYS, setDb, setMeta } from '@/lib/local/db';
import { setShowcase } from '@/lib/showcase';
import { uuidv7 } from '@/lib/uuid';

const SEEDED_ON = 'showcaseSeededOn';
const SEEDED_SHOP = 'showcaseShop';

/**
 * The demo link: a sample shop with two weeks of trading, no sign-in.
 * Everything stays in this browser (see lib/showcase.ts). Kitabu offers four
 * trades (/demo?shop=hardware|duka|wholesale|clothes); /demo alone opens the
 * hardware shop and /demo?chagua=1 shows the choice. Daftari opens its one duka. The shop is rebuilt when the link is
 * opened on a new day or for another trade, so "today" always has sales in
 * it. ?lang=sw or ?lang=en sets the language; otherwise the phone's own.
 */
export default function DemoPage() {
  const t = useTranslations('demo');
  const setLocale = useSetLocale();
  const [shop, setShop] = useState<DemoShop | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Which shop: from the link, or the choice below.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // /demo opens the hardware shop; the strip's "Badilisha" comes back with ?chagua=1 for the choice.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShop(params.get('chagua') === '1' ? null : demoShop(params.get('shop') ?? 'hardware', IS_DAFTARI));
    const lang = params.get('lang');
    if (isLocale(lang)) void setLocale(lang);
  }, [setLocale]);

  useEffect(() => {
    if (!shop) return;
    let cancelled = false;
    void (async () => {
      try {
        const asked = new URLSearchParams(window.location.search).get('lang');
        const lang = isLocale(asked) ? asked : DEFAULT_LOCALE;
        setShowcase(true);
        setDb(null);

        const fresh =
          (await getMeta(SEEDED_ON, null)) === businessDay() &&
          (await getMeta(SEEDED_SHOP, null)) === shop.key &&
          (await getMeta(META_KEYS.activeBusinessId, null));
        if (!fresh) {
          await db().delete();
          setDb(null);
          const userId = uuidv7();
          await setMeta(META_KEYS.userId, userId);
          await setMeta('phone', '+255712000000');
          await setMeta(META_KEYS.mustSetPassword, false);
          await setMeta(META_KEYS.operator, false);
          const { createDemoBusiness } = await import('@/lib/demo');
          await createDemoBusiness(userId, shop.name, lang, shop.type, { owner: shop.owner, staff: shop.staff });
          await setMeta(SEEDED_ON, businessDay());
          await setMeta(SEEDED_SHOP, shop.key);
        }
        // A full load, so every screen opens on the demo database.
        if (!cancelled) window.location.replace(withBase(`${HOME}/`));
      } catch (error) {
        console.error(error);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shop, attempt]);

  if (shop === null) return <DemoPicker onPick={setShop} />;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-paper p-6 text-center">
      <Logo size={64} />
      {failed ? (
        <>
          <p className="font-semibold">{t('failed')}</p>
          <Button onClick={() => { setFailed(false); setAttempt((n) => n + 1); }}>{t('retry')}</Button>
        </>
      ) : shop ? (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-brand" />
          <p className="font-semibold">{t('opening')}</p>
          <p className="text-lg font-bold">{shop.name}</p>
          <p className="max-w-xs text-sm text-ink-soft">{t('openingHint')}</p>
        </>
      ) : null}
    </div>
  );
}
