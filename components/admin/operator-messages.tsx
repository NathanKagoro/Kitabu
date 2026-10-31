'use client';

import { NextIntlClientProvider, useLocale, useMessages, type AbstractIntlMessages } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';

const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  sw: () => import('@/messages/operator/sw.json'),
  en: () => import('@/messages/operator/en.json'),
};

/**
 * The operator's wording (messages/operator), loaded only on the operator's
 * screens: traders never open them, so their phones never download it.
 */
export function OperatorMessages({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const base = useMessages();
  const [extra, setExtra] = useState<{ locale: string; messages: AbstractIntlMessages } | null>(null);

  useEffect(() => {
    let live = true;
    void (loaders[locale] ?? loaders.sw!)().then((module) => {
      if (live) setExtra({ locale, messages: module.default as AbstractIntlMessages });
    });
    return () => {
      live = false;
    };
  }, [locale]);

  if (!extra || extra.locale !== locale) return null;
  return (
    <NextIntlClientProvider locale={locale} messages={{ ...base, ...extra.messages }} timeZone="Africa/Dar_es_Salaam">
      {children}
    </NextIntlClientProvider>
  );
}
