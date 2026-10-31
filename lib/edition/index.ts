/**
 * One codebase, two products. NEXT_PUBLIC_EDITION=daftari builds Daftari, the
 * simple sales book for very small shops (one owner, one phone); anything else
 * builds Kitabu. The edition decides the name, the home screen, the tabs, the
 * default colour and which parts of the app can exist at all. The maths is the
 * same code in both, by construction.
 */
export type Edition = 'kitabu' | 'daftari';

export const EDITION: Edition = process.env.NEXT_PUBLIC_EDITION === 'daftari' ? 'daftari' : 'kitabu';
export const IS_DAFTARI = EDITION === 'daftari';

export const APP_NAME = IS_DAFTARI ? 'Daftari' : 'Kitabu';
export const APP_TAGLINE = IS_DAFTARI ? 'Daftari lako la mauzo, mkononi' : 'Biashara yako, mkononi';

/** Where the app opens after sign-in: Daftari's summary, Kitabu's till. */
export const HOME = IS_DAFTARI ? '/leo' : '/mauzo';

/** A shop with no colour of its own: Kitabu red (the first Daftari's), Daftari notebook blue. */
export const EDITION_BRAND = IS_DAFTARI ? '#1d5c8c' : '#c8211e';
