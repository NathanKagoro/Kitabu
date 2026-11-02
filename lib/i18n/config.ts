export const LOCALES = ['sw', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * The language a phone starts in until its owner picks one: English for
 * Kitabu (shops with staff and suppliers, often working in English),
 * Swahili for Daftari (informal sellers). Both are complete; the switch is in
 * Mipangilio.
 */
export const DEFAULT_LOCALE: Locale = process.env.NEXT_PUBLIC_EDITION === 'daftari' ? 'sw' : 'en';

/** Where the phone remembers its language (localStorage). */
export const LOCALE_STORAGE_KEY = 'kitabu_locale';

export const LOCALE_NAMES: Record<Locale, string> = {
  sw: 'Kiswahili',
  en: 'English',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
