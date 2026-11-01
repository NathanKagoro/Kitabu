import type { BusinessType } from './types';

/**
 * The sample shops behind the demo link. Kitabu offers four trades, each with
 * an owner and staff so "sales by seller" has people in it; Daftari, one
 * owner and one small duka. Opened as /demo?shop=<key>; /demo alone shows the
 * choice (Kitabu) or opens the duka (Daftari).
 */
export interface DemoShop {
  key: 'hardware' | 'duka' | 'wholesale' | 'clothes';
  type: BusinessType;
  name: string;
  owner: string;
  staff: readonly { name: string; role: 'manager' | 'cashier' }[];
}

export const KITABU_DEMOS: readonly DemoShop[] = [
  {
    key: 'hardware',
    type: 'hardware',
    name: 'Baraka Hardware',
    owner: 'Baraka',
    staff: [
      { name: 'Neema', role: 'manager' },
      { name: 'Juma', role: 'cashier' },
    ],
  },
  { key: 'duka', type: 'duka', name: 'Duka la Upendo', owner: 'Salma', staff: [{ name: 'Rashidi', role: 'cashier' }] },
  {
    key: 'wholesale',
    type: 'wholesale',
    name: 'Kariakoo Jumla Traders',
    owner: 'Abdul',
    staff: [
      { name: 'Fatma', role: 'manager' },
      { name: 'Said', role: 'cashier' },
    ],
  },
  { key: 'clothes', type: 'clothes', name: 'Zuhura Fashion', owner: 'Zuhura', staff: [{ name: 'Grace', role: 'cashier' }] },
];

export const DAFTARI_DEMO: DemoShop = { key: 'duka', type: 'duka', name: 'Duka la Mama Asha', owner: 'Mama Asha', staff: [] };

export function demoShop(key: string | null, daftari: boolean): DemoShop | null {
  if (daftari) return DAFTARI_DEMO;
  return KITABU_DEMOS.find((shop) => shop.key === key) ?? null;
}
