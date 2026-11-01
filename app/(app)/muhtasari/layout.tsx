'use client';

import type { ReactNode } from 'react';

import { ExtraMessages, type MessageLoaders } from '@/components/extra-messages';

const loaders: MessageLoaders = {
  sw: () => import('@/messages/dashboard/sw.json'),
  en: () => import('@/messages/dashboard/en.json'),
};

/** The dashboard's wording (messages/dashboard) loads with the dashboard, not with the till. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ExtraMessages loaders={loaders}>{children}</ExtraMessages>;
}
