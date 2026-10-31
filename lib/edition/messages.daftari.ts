/** Daftari's own wording (messages/daftari), merged over the shared wording. */
import type { AbstractIntlMessages } from 'next-intl';

import sw from '@/messages/daftari/sw.json';

export const EDITION_MESSAGES_SW = sw as unknown as AbstractIntlMessages;
export async function editionMessagesEn(): Promise<AbstractIntlMessages> {
  return (await import('@/messages/daftari/en.json')).default as unknown as AbstractIntlMessages;
}
