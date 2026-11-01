import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Business } from '@/lib/types';

const shop = { type: 'hardware', mode: 'biashara', settings: { features: { staff: true, documents: true, traReceipts: true } } } as unknown as Business;

async function load(edition: string | undefined) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_EDITION', edition ?? '');
  return { config: await import('@/lib/shop-config'), edition: await import('@/lib/edition') };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('one codebase, two products', () => {
  it('Kitabu keeps every part a shop switched on, and opens on the business dashboard', async () => {
    const { config, edition } = await load(undefined);
    expect(edition.APP_NAME).toBe('Kitabu');
    expect(edition.HOME).toBe('/muhtasari');
    expect(config.shopHasFeature(shop, 'staff')).toBe(true);
    expect(config.shopHasFeature(shop, 'traReceipts')).toBe(true);
    expect(config.brandColorOf({ settings: {} })).toBe('#1b3a6b');
  });

  it('Daftari leaves out staff, invoices and TRA receipts whatever the settings say, and opens on Leo', async () => {
    const { config, edition } = await load('daftari');
    expect(edition.APP_NAME).toBe('Daftari');
    expect(edition.HOME).toBe('/leo');
    for (const feature of ['staff', 'documents', 'traReceipts', 'suppliers', 'vat'] as const) {
      expect(config.shopHasFeature(shop, feature), feature).toBe(false);
    }
    expect(config.shopHasFeature(shop, 'credit')).toBe(true);
    expect(config.brandColorOf({ settings: {} })).toBe('#c8211e');
  });
});
