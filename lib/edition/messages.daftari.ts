/** Daftari's wording: Swahili first, with its own words (messages/daftari) over the shared ones. */
import type { AbstractIntlMessages } from 'next-intl';

import type { Locale } from '@/lib/i18n/config';
import extraSw from '@/messages/daftari/sw.json';
import baseSw from '@/messages/sw.json';

export const DEFAULT_MESSAGES = { ...baseSw, ...extraSw } as unknown as AbstractIntlMessages;

export async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  if (locale === 'sw') return DEFAULT_MESSAGES;
  const [base, extra] = await Promise.all([import('@/messages/en.json'), import('@/messages/daftari/en.json')]);
  return { ...(base.default as unknown as AbstractIntlMessages), ...(extra.default as unknown as AbstractIntlMessages) };
}
