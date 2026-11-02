/**
 * The wording each edition ships with. Kitabu opens in English, with Swahili
 * fetched only by phones that choose it; the Daftari build swaps this file for
 * messages.daftari.ts (next.config.ts, webpack alias), which opens in Swahili
 * with Daftari's own wording, so neither app downloads the other's.
 */
import type { AbstractIntlMessages } from 'next-intl';

import type { Locale } from '@/lib/i18n/config';
import en from '@/messages/en.json';

export const DEFAULT_MESSAGES = en as unknown as AbstractIntlMessages;

export async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  if (locale === 'en') return DEFAULT_MESSAGES;
  return (await import('@/messages/sw.json')).default as unknown as AbstractIntlMessages;
}
