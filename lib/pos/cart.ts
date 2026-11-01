import { isListPrice, priceFor } from '../calc/pricing';
import type { CartLine } from '../calc/sale';
import { productLabel } from '../products';
import type { Product } from '../types';
import { uuidv7 } from '../uuid';

export interface CartState {
  lines: CartLine[];
  discount: number;
}

export type CartAction =
  | { type: 'add'; product: Product; qty?: number; lineId?: string }
  /** With `product`, a line still at a list price is re-priced for the new quantity (wholesale from its minimum). */
  | { type: 'setQty'; lineId: string; qty: number; product?: Product }
  | { type: 'setPrice'; lineId: string; unitPrice: number }
  | { type: 'remove'; lineId: string }
  | { type: 'addAmount'; amount: number; description: string }
  | { type: 'setDiscount'; discount: number }
  | { type: 'clear' };

export const EMPTY_CART: CartState = { lines: [], discount: 0 };

/**
 * Tapping a tile twice means two of it, on the same line -- unless the price on
 * that line was bargained, in which case the new unit is at list price and gets
 * its own line so the bargain does not silently spread. A line at a list price
 * follows its quantity: wholesale from the product's minimum, retail below.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const qty = action.qty ?? 1;
      const existing = state.lines.find(
        (line) => line.productId === action.product.id && isListPrice(action.product, line.unitPrice)
      );
      if (existing) {
        const next = round3(existing.qty + qty);
        return {
          ...state,
          lines: state.lines.map((line) =>
            line.id === existing.id ? { ...line, qty: next, unitPrice: priceFor(action.product, next) } : line
          ),
        };
      }
      return {
        ...state,
        lines: [
          ...state.lines,
          {
            id: action.lineId ?? uuidv7(),
            productId: action.product.id,
            description: productLabel(action.product),
            qty,
            unitPrice: priceFor(action.product, qty),
            unitCost: action.product.cost ?? null,
            vatType: action.product.vatType,
          },
        ],
      };
    }
    case 'setQty':
      if (action.qty <= 0) return cartReducer(state, { type: 'remove', lineId: action.lineId });
      return {
        ...state,
        lines: state.lines.map((line) => {
          if (line.id !== action.lineId) return line;
          const qty = round3(action.qty);
          const relist = action.product && line.productId === action.product.id && isListPrice(action.product, line.unitPrice);
          return { ...line, qty, unitPrice: relist ? priceFor(action.product!, qty) : line.unitPrice };
        }),
      };
    case 'setPrice':
      return {
        ...state,
        lines: state.lines.map((line) =>
          line.id === action.lineId ? { ...line, unitPrice: Math.max(0, Math.round(action.unitPrice)) } : line
        ),
      };
    case 'remove': {
      const lines = state.lines.filter((line) => line.id !== action.lineId);
      return { lines, discount: lines.length ? state.discount : 0 };
    }
    case 'addAmount':
      return {
        ...state,
        lines: [
          ...state.lines,
          {
            id: uuidv7(),
            productId: null,
            description: action.description,
            qty: 1,
            unitPrice: Math.round(action.amount),
            unitCost: null,
            vatType: 'standard',
          },
        ],
      };
    case 'setDiscount':
      return { ...state, discount: Math.max(0, Math.round(action.discount)) };
    case 'clear':
      return EMPTY_CART;
  }
}

/** The line a tap on this product would land on, or null for a new line. */
export function lineFor(state: CartState, product: Product): string | null {
  return (
    state.lines.find((line) => line.productId === product.id && isListPrice(product, line.unitPrice))?.id ??
    null
  );
}

export function cartQtyByProduct(lines: readonly CartLine[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const line of lines) {
    if (line.productId) out.set(line.productId, round3((out.get(line.productId) ?? 0) + line.qty));
  }
  return out;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
