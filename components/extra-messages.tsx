'use client';

import { NextIntlClientProvider, useLocale, useMessages, type AbstractIntlMessages } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';

export type MessageLoaders = Record<string, () => Promise<{ default: unknown }>>;

/**
 * Wording for one part of the app (messages/<part>), loaded only when that
 * part opens, so it never weighs on the sales screen's first load. Renders
 * nothing for the moment it takes to load (from the phone's cache offline).
 */
export function ExtraMessages({ loaders, children }: { loaders: MessageLoaders; children: ReactNode }) {
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
  }, [locale, loaders]);

  if (!extra || extra.locale !== locale) return null;
  return (
    <NextIntlClientProvider locale={locale} messages={{ ...base, ...extra.messages }} timeZone="Africa/Dar_es_Salaam">
      {children}
    </NextIntlClientProvider>
  );
}
