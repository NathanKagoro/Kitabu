import type { MetadataRoute } from 'next';

import { withBase } from '@/lib/base-path';
import { APP_NAME, APP_TAGLINE, EDITION_BRAND, IS_DAFTARI } from '@/lib/edition';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    start_url: withBase('/'),
    scope: withBase('/'),
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf8f4',
    theme_color: EDITION_BRAND,
    lang: 'sw',
    dir: 'ltr',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      { src: withBase('/icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: withBase('/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: withBase('/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      ...(IS_DAFTARI ? [{ name: 'Leo', short_name: 'Leo', url: withBase('/leo/') }] : []),
      { name: 'Mauzo', short_name: 'Mauzo', url: withBase('/mauzo/') },
      { name: 'Madeni', short_name: 'Madeni', url: withBase('/madeni/') },
      { name: 'Hesabu ya leo', short_name: 'Hesabu', url: withBase('/hesabu/') },
    ],
  };
}
