'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';

import { isShowcase } from '@/lib/showcase';

// Real shops never see the strip, so its code stays out of the first load.
const ShowcaseStrip = dynamic(() => import('@/components/showcase-strip').then((m) => m.ShowcaseStrip), { ssr: false });

/**
 * A thin strip on every screen of the demo link: this is a sample shop, a
 * way to another sample shop (Kitabu), and a way out. Leaving goes back to
 * the phone's own sign-in and data.
 */
const noSubscribe = () => () => {};

export function ShowcaseBar() {
  // False while the page is built, the browser's answer once it runs.
  const on = useSyncExternalStore(noSubscribe, isShowcase, () => false);
  return on ? <ShowcaseStrip /> : null;
}
