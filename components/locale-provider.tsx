'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, type Locale } from '@/lib/i18n/config';
import { DEFAULT_MESSAGES, loadMessages } from '@/lib/edition/messages';

/**
 * The language lives on the phone (localStorage), not in a cookie: the app is
 * plain files on a static host, so there is no server to read a cookie. The
 * HTML arrives in the edition's language (English for Kitabu, Swahili for
 * Daftari); a phone set to the other switches straight after it loads, and
 * only those phones fetch it.
 */

type SetLocale = (locale: Locale) => Promise<void>;
const SetLocaleContext = createContext<SetLocale | null>(null);

function storedLocale(): Locale {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ locale: Locale; messages: AbstractIntlMessages }>({
    locale: DEFAULT_LOCALE,
    messages: DEFAULT_MESSAGES,
  });

  const apply = useCallback(async (locale: Locale) => {
    const messages = await loadMessages(locale);
    document.documentElement.lang = locale;
    setState({ locale, messages });
  }, []);

  useEffect(() => {
    const saved = storedLocale();
    if (saved === DEFAULT_LOCALE) return;
    let live = true;
    void loadMessages(saved).then((messages) => {
      if (!live) return;
      document.documentElement.lang = saved;
      setState({ locale: saved, messages });
    });
    return () => {
      live = false;
    };
  }, []);

  const setLocale = useCallback<SetLocale>(
    async (locale) => {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        // Private mode: the switch still applies for this visit.
      }
      await apply(locale);
    },
    [apply]
  );

  return (
    <SetLocaleContext.Provider value={setLocale}>
      <NextIntlClientProvider locale={state.locale} messages={state.messages} timeZone="Africa/Dar_es_Salaam">
        {children}
      </NextIntlClientProvider>
    </SetLocaleContext.Provider>
  );
}

export function useSetLocale(): SetLocale {
  const context = useContext(SetLocaleContext);
  if (!context) throw new Error('useSetLocale must be used inside <LocaleProvider>');
  return context;
}
