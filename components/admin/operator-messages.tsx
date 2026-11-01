'use client';

import type { ReactNode } from 'react';

import { ExtraMessages, type MessageLoaders } from '@/components/extra-messages';

const loaders: MessageLoaders = {
  sw: () => import('@/messages/operator/sw.json'),
  en: () => import('@/messages/operator/en.json'),
};

/**
 * The operator's wording (messages/operator), loaded only on the operator's
 * screens: traders never open them, so their phones never download it.
 */
export function OperatorMessages({ children }: { children: ReactNode }) {
  return <ExtraMessages loaders={loaders}>{children}</ExtraMessages>;
}
