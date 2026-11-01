import { describe, expect, it } from 'vitest';

import { hasWholesale, isListPrice, priceFor } from '@/lib/calc/pricing';
import { cartReducer, EMPTY_CART } from '@/lib/pos/cart';
import type { Product } from '@/lib/types';

const cement = {
  id: 'cement',
  businessId: 'b',
  name: 'Saruji',
  unit: 'kipande',
  price: 17_500,
  cost: 15_500,
  wholesalePrice: 16_800,
  wholesaleMinQty: 10,
  trackStock: true,
  vatType: 'standard',
  sortOrder: 0,
  active: true,
  createdAt: '',
  updatedAt: '',
} satisfies Product;

describe('wholesale prices', () => {
  it('applies the wholesale price from the minimum quantity on one line', () => {
    expect(priceFor(cement, 9)).toBe(17_500);
    expect(priceFor(cement, 10)).toBe(16_800);
    expect(priceFor(cement, 25.5)).toBe(16_800);
  });

  it('ignores a wholesale price that is missing, not lower than retail, or has no minimum', () => {
    expect(hasWholesale({ ...cement, wholesalePrice: null })).toBe(false);
    expect(hasWholesale({ ...cement, wholesalePrice: 18_000 })).toBe(false);
    expect(hasWholesale({ ...cement, wholesaleMinQty: 0 })).toBe(false);
    expect(priceFor({ ...cement, wholesaleMinQty: null }, 100)).toBe(17_500);
  });

  it('knows a list price from a bargained one', () => {
    expect(isListPrice(cement, 17_500)).toBe(true);
    expect(isListPrice(cement, 16_800)).toBe(true);
    expect(isListPrice(cement, 17_000)).toBe(false);
  });

  it('re-prices a till line as its quantity crosses the minimum, both ways', () => {
    let cart = cartReducer(EMPTY_CART, { type: 'add', product: cement, qty: 9 });
    expect(cart.lines[0]!.unitPrice).toBe(17_500);
    cart = cartReducer(cart, { type: 'add', product: cement });
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]).toMatchObject({ qty: 10, unitPrice: 16_800 });
    cart = cartReducer(cart, { type: 'setQty', lineId: cart.lines[0]!.id, qty: 4, product: cement });
    expect(cart.lines[0]).toMatchObject({ qty: 4, unitPrice: 17_500 });
  });

  it('leaves a bargained price alone when the quantity changes', () => {
    let cart = cartReducer(EMPTY_CART, { type: 'add', product: cement, qty: 2 });
    const id = cart.lines[0]!.id;
    cart = cartReducer(cart, { type: 'setPrice', lineId: id, unitPrice: 17_000 });
    cart = cartReducer(cart, { type: 'setQty', lineId: id, qty: 12, product: cement });
    expect(cart.lines[0]).toMatchObject({ qty: 12, unitPrice: 17_000 });
    // Another tap at list price starts its own line.
    cart = cartReducer(cart, { type: 'add', product: cement });
    expect(cart.lines).toHaveLength(2);
  });
});
