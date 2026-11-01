/**
 * Retail and wholesale prices. A product can carry a second, lower price for
 * bulk (bei ya jumla) that applies when one sale line reaches its minimum
 * quantity. The till uses these to re-price a line as its quantity changes,
 * unless the seller has bargained a price by hand.
 */
import type { Product } from '../types';

type Priced = Pick<Product, 'price' | 'wholesalePrice' | 'wholesaleMinQty'>;

/** True when the product has a usable wholesale price: set, positive, below retail, with a minimum above zero. */
export function hasWholesale(product: Priced): boolean {
  return (
    product.wholesalePrice != null &&
    product.wholesalePrice > 0 &&
    product.wholesalePrice < product.price &&
    product.wholesaleMinQty != null &&
    product.wholesaleMinQty > 0
  );
}

/** The unit price for `qty` on one line: wholesale from the minimum quantity up, retail below it. */
export function priceFor(product: Priced, qty: number): number {
  return hasWholesale(product) && qty >= product.wholesaleMinQty! ? product.wholesalePrice! : product.price;
}

/** True when `unitPrice` is one of the product's own prices, i.e. not bargained at the till. */
export function isListPrice(product: Priced, unitPrice: number): boolean {
  return unitPrice === product.price || (hasWholesale(product) && unitPrice === product.wholesalePrice);
}
