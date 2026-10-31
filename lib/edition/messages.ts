/**
 * Extra wording for the edition being built. Kitabu has none; the Daftari
 * build swaps this file for messages.daftari.ts (next.config.ts, webpack
 * alias), so Kitabu's phones never download Daftari's wording.
 */
import type { AbstractIntlMessages } from 'next-intl';

export const EDITION_MESSAGES_SW: AbstractIntlMessages = {};
export async function editionMessagesEn(): Promise<AbstractIntlMessages> {
  return {};
}
