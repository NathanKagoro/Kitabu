'use client';

import type { ReactNode } from 'react';

import { ExtraMessages, type MessageLoaders } from '@/components/extra-messages';

const loaders: MessageLoaders = {
  sw: () => import('@/messages/inventory/sw.json'),
  en: () => import('@/messages/inventory/en.json'),
};

/** The stock screens' wording (messages/inventory) loads with them, not with the till. */
export default function ProductsLayout({ children }: { children: ReactNode }) {
  return <ExtraMessages loaders={loaders}>{children}</ExtraMessages>;
}
