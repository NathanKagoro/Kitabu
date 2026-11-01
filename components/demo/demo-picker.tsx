'use client';

import { useTranslations } from 'next-intl';

import { ExtraMessages, type MessageLoaders } from '@/components/extra-messages';
import { ChevronRight } from '@/components/icons';
import { Band, BandTitle } from '@/components/ui/band';
import { KITABU_DEMOS, type DemoShop } from '@/lib/demo-shops';

const loaders: MessageLoaders = {
  sw: () => import('@/messages/demo/sw.json'),
  en: () => import('@/messages/demo/en.json'),
};

/** The choice of sample shops on Kitabu's demo link: one panel per trade. */
export function DemoPicker({ onPick }: { onPick: (shop: DemoShop) => void }) {
  return (
    <ExtraMessages loaders={loaders}>
      <Choices onPick={onPick} />
    </ExtraMessages>
  );
}

function Choices({ onPick }: { onPick: (shop: DemoShop) => void }) {
  const t = useTranslations('demoPick');
  return (
    <div className="min-h-dvh bg-paper pb-8">
      <Band>
        <div className="flex min-h-14 items-center px-4 py-2">
          <BandTitle title={t('pickTitle')} />
        </div>
      </Band>
      <p className="mx-auto max-w-lg px-4 pt-4 text-[15px] text-ink-soft">{t('pickHint')}</p>
      <ul className="mx-auto mt-3 max-w-lg space-y-3 px-3">
        {KITABU_DEMOS.map((shop) => (
          <li key={shop.key}>
            <button
              onClick={() => onPick(shop)}
              className="flex w-full items-center gap-3 rounded-[12px] border border-line bg-surface p-4 text-left active:bg-paper"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-brand">{t(`shops.${shop.key}.kind`)}</span>
                <span className="mt-0.5 block text-lg leading-snug font-bold">{shop.name}</span>
                <span className="mt-1 block text-sm leading-snug text-ink-soft">{t(`shops.${shop.key}.about`)}</span>
              </span>
              <ChevronRight size={22} className="shrink-0 text-ink-faint" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
