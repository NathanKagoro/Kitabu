import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { iconFor, iconsFor, STARTER_PRODUCTS } from '@/lib/onboarding/starter-products';
import { isProductIconKey, LEGACY_EMOJI, PRODUCT_ICON_KEYS, productIconKey } from '@/lib/product-icons';
import type { BusinessType } from '@/lib/types';

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const TYPES: BusinessType[] = ['cosmetics', 'clothes', 'hardware', 'duka', 'genge', 'pharmacy', 'wholesale', 'services', 'other'];

describe('product pictures are icons, never emoji', () => {
  it('the sprite has a drawing for every icon name (run `npm run icons:products` if not)', () => {
    const sprite = readFileSync(join(process.cwd(), 'public', 'product-icons.svg'), 'utf8');
    for (const key of PRODUCT_ICON_KEYS) expect(sprite).toContain(`<symbol id="${key}"`);
  });

  it('every old emoji translates to a real icon', () => {
    for (const [emoji, key] of Object.entries(LEGACY_EMOJI)) {
      expect(isProductIconKey(key), `${emoji} -> ${key}`).toBe(true);
      expect(productIconKey(emoji)).toBe(key);
    }
  });

  it('anything unknown, empty or missing falls back to a package, not an emoji', () => {
    expect(productIconKey(null)).toBe('package');
    expect(productIconKey('')).toBe('package');
    expect(productIconKey('🦄')).toBe('package');
    expect(productIconKey('hammer')).toBe('hammer');
  });

  it('starter products, category pictures and the picker hold only icon names', () => {
    for (const type of TYPES) {
      for (const product of STARTER_PRODUCTS[type]) {
        expect(EMOJI.test(product.icon), `${type}: ${product.name}`).toBe(false);
        expect(isProductIconKey(product.icon), `${type}: ${product.name} -> ${product.icon}`).toBe(true);
      }
      for (const key of iconsFor(type)) expect(isProductIconKey(key), `${type} picker: ${key}`).toBe(true);
      expect(isProductIconKey(iconFor(type, null))).toBe(true);
    }
  });
});
