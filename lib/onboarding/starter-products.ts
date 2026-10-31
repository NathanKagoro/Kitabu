import type { BusinessType, ProductUnit } from '../types';

export interface StarterProduct {
  name: string;
  /** Shade, size or type, for trades that have them. */
  variant?: string;
  /** One of the preset categories for this shop type (lib/shop-config.ts). */
  category?: string;
  unit: ProductUnit;
  /** For unit 'custom': what it is sold by ("jozi", "mita"). */
  unitLabel?: string;
  icon: string;
  /** Typical Dar prices (TZS), used only by the demo shop. Real shops set their own. */
  price: number;
  cost: number;
  /** The bulk size it is usually bought in, for the demo. */
  pack?: { label: string; units: number };
}

/**
 * What each kind of shop sells on day one, named the way it is said in the
 * shop, sorted into that shop type's categories. Onboarding (demo) offers
 * them with prices blank; the demo shop uses the prices. Every type has its
 * own list and its own pictures -- no vegetables in a cosmetics shop.
 */
export const STARTER_PRODUCTS: Record<BusinessType, readonly StarterProduct[]> = {
  cosmetics: [
    { name: 'Nivea Lotion', variant: '400ml', category: 'Losheni', unit: 'kipande', icon: 'droplet', price: 12500, cost: 9000, pack: { label: 'katoni', units: 12 } },
    { name: 'Nivea Lotion', variant: '200ml', category: 'Losheni', unit: 'kipande', icon: 'droplet', price: 7000, cost: 5000, pack: { label: 'katoni', units: 24 } },
    { name: 'Lipstick Flormar', variant: 'Red 01', category: 'Make-up', unit: 'kipande', icon: 'sparkles', price: 8000, cost: 5500 },
    { name: 'Lipstick Flormar', variant: 'Nude 03', category: 'Make-up', unit: 'kipande', icon: 'sparkles', price: 8000, cost: 5500 },
    { name: 'Poda ya uso', variant: 'Beige', category: 'Make-up', unit: 'kipande', icon: 'smile', price: 15000, cost: 10500 },
    { name: 'Rangi ya kucha', variant: 'Pink', category: 'Kucha', unit: 'kipande', icon: 'paintbrush', price: 3000, cost: 1800, pack: { label: 'boksi', units: 12 } },
    { name: 'Mafuta ya nywele', variant: '250ml', category: 'Nywele', unit: 'kipande', icon: 'box', price: 6000, cost: 4200 },
    { name: 'Manukato', variant: '100ml', category: 'Manukato', unit: 'kipande', icon: 'flower', price: 25000, cost: 17000 },
    { name: 'Sabuni ya kuogea', variant: 'Dove', category: 'Sabuni', unit: 'kipande', icon: 'droplets', price: 3500, cost: 2500, pack: { label: 'katoni', units: 48 } },
  ],
  clothes: [
    { name: 'Gauni la kitenge', variant: 'M', category: 'Magauni', unit: 'kipande', icon: 'shirt', price: 35000, cost: 22000 },
    { name: 'Gauni la kitenge', variant: 'L', category: 'Magauni', unit: 'kipande', icon: 'shirt', price: 35000, cost: 22000 },
    { name: 'Shati la mikono mirefu', variant: 'L · Bluu', category: 'Mashati', unit: 'kipande', icon: 'shirt', price: 25000, cost: 15000 },
    { name: 'Jeans', variant: '32', category: 'Suruali', unit: 'kipande', icon: 'shirt', price: 30000, cost: 18000 },
    { name: 'Raba', variant: '42', category: 'Viatu', unit: 'custom', unitLabel: 'jozi', icon: 'footprints', price: 45000, cost: 30000 },
    { name: 'Sendozi', variant: '38', category: 'Viatu', unit: 'custom', unitLabel: 'jozi', icon: 'footprints', price: 20000, cost: 12000 },
    { name: 'Mkoba wa mkono', category: 'Mikoba', unit: 'kipande', icon: 'shopping-bag', price: 28000, cost: 16000 },
    { name: 'Hereni', category: 'Vito', unit: 'custom', unitLabel: 'jozi', icon: 'gem', price: 5000, cost: 2500 },
    { name: 'Nguo ya mtoto', variant: '2–3 yrs', category: 'Nguo za watoto', unit: 'kipande', icon: 'gift', price: 12000, cost: 7000 },
  ],
  hardware: [
    { name: 'Saruji', variant: '50kg', category: 'Saruji', unit: 'kipande', icon: 'brick-wall', price: 17500, cost: 15500 },
    { name: 'Nondo', variant: '12mm', category: 'Nondo na chuma', unit: 'kipande', icon: 'construction', price: 24000, cost: 20500 },
    { name: 'Bati', variant: 'Gauge 30', category: 'Mabati', unit: 'kipande', icon: 'house', price: 22000, cost: 18500 },
    { name: 'Misumari', variant: '3 inchi', category: 'Misumari na skrubu', unit: 'kg', icon: 'bolt', price: 4500, cost: 3500, pack: { label: 'boksi 25kg', units: 25 } },
    { name: 'Rangi ya maji', variant: '20L · Nyeupe', category: 'Rangi', unit: 'kipande', icon: 'paint-bucket', price: 85000, cost: 68000 },
    { name: 'Bomba la PVC', variant: '1/2 inchi', category: 'Bomba na maji', unit: 'kipande', icon: 'cylinder', price: 9000, cost: 6500 },
    { name: 'Waya wa umeme', variant: '2.5mm', category: 'Umeme', unit: 'custom', unitLabel: 'mita', icon: 'zap', price: 1500, cost: 1000 },
    { name: 'Nyundo', category: 'Zana', unit: 'kipande', icon: 'hammer', price: 12000, cost: 8000 },
    { name: 'Kufuli', variant: 'Solex', category: 'Zana', unit: 'kipande', icon: 'lock', price: 15000, cost: 10000 },
  ],
  duka: [
    { name: 'Sukari', category: 'Vyakula', unit: 'kg', icon: 'wheat', price: 3200, cost: 2800, pack: { label: 'mfuko 50kg', units: 50 } },
    { name: 'Mchele', category: 'Vyakula', unit: 'kg', icon: 'wheat', price: 3000, cost: 2500, pack: { label: 'mfuko 25kg', units: 25 } },
    { name: 'Unga wa sembe', category: 'Vyakula', unit: 'kg', icon: 'wheat', price: 1800, cost: 1500 },
    { name: 'Mafuta ya kupikia', category: 'Vyakula', unit: 'lita', icon: 'droplet', price: 5000, cost: 4300, pack: { label: 'dumu 20L', units: 20 } },
    { name: 'Sabuni ya kipande', category: 'Usafi', unit: 'kipande', icon: 'droplets', price: 1500, cost: 1100, pack: { label: 'katoni', units: 48 } },
    { name: 'Chumvi', category: 'Vyakula', unit: 'pakti', icon: 'box', price: 500, cost: 350 },
    { name: 'Chai (majani)', category: 'Vyakula', unit: 'pakti', icon: 'coffee', price: 1500, cost: 1100 },
    { name: 'Maji ya kunywa', category: 'Vinywaji', unit: 'kipande', icon: 'glass-water', price: 700, cost: 450, pack: { label: 'katoni', units: 12 } },
    { name: 'Soda', category: 'Vinywaji', unit: 'kipande', icon: 'cup-soda', price: 1000, cost: 750, pack: { label: 'kreti', units: 24 } },
    { name: 'Vocha', category: 'Vocha', unit: 'kipande', icon: 'smartphone', price: 1000, cost: 950 },
  ],
  genge: [
    { name: 'Nyanya', unit: 'fungu', icon: 'cherry', price: 1000, cost: 600, pack: { label: 'tenga', units: 40 } },
    { name: 'Vitunguu', unit: 'fungu', icon: 'sprout', price: 1000, cost: 650, pack: { label: 'gunia', units: 50 } },
    { name: 'Sukuma wiki', unit: 'bunda', icon: 'salad', price: 500, cost: 250, pack: { label: 'tita', units: 25 } },
    { name: 'Mchicha', unit: 'bunda', icon: 'leaf', price: 500, cost: 250, pack: { label: 'tita', units: 25 } },
    { name: 'Ndizi', unit: 'kipande', icon: 'banana', price: 300, cost: 150, pack: { label: 'mkungu', units: 60 } },
    { name: 'Viazi', unit: 'fungu', icon: 'sprout', price: 1500, cost: 1000, pack: { label: 'gunia', units: 50 } },
    { name: 'Karoti', unit: 'fungu', icon: 'carrot', price: 1000, cost: 600, pack: { label: 'gunia', units: 40 } },
    { name: 'Hoho', unit: 'kipande', icon: 'salad', price: 500, cost: 300, pack: { label: 'ndoo', units: 30 } },
    { name: 'Nazi', unit: 'kipande', icon: 'nut', price: 1500, cost: 900, pack: { label: 'gunia', units: 30 } },
    { name: 'Limau', unit: 'fungu', icon: 'citrus', price: 500, cost: 250, pack: { label: 'ndoo', units: 40 } },
  ],
  pharmacy: [
    { name: 'Panadol', variant: '500mg', category: 'Dawa za maumivu', unit: 'pakti', icon: 'pill', price: 1500, cost: 1000, pack: { label: 'boksi', units: 10 } },
    { name: 'Amoxicillin', variant: '250mg', category: 'Antibiotiki', unit: 'pakti', icon: 'pill', price: 3000, cost: 2000 },
    { name: 'ORS', category: 'Dawa za maumivu', unit: 'pakti', icon: 'cup-soda', price: 500, cost: 300 },
    { name: 'Vitamini C', category: 'Vitamini', unit: 'pakti', icon: 'citrus', price: 4000, cost: 2800 },
    { name: 'Pedi', category: 'Usafi', unit: 'pakti', icon: 'bandage', price: 2500, cost: 1800 },
    { name: 'Dawa ya kikohozi', variant: '100ml', category: 'Dawa za maumivu', unit: 'kipande', icon: 'droplet', price: 5000, cost: 3500 },
    { name: 'Mipira ya mkono', category: 'Vifaa tiba', unit: 'pakti', icon: 'hand', price: 1000, cost: 600 },
    { name: 'Kipimajoto', category: 'Vifaa tiba', unit: 'kipande', icon: 'thermometer', price: 8000, cost: 5000 },
  ],
  wholesale: [
    { name: 'Sukari', variant: 'mfuko 50kg', category: 'Vyakula', unit: 'kipande', icon: 'wheat', price: 150000, cost: 140000 },
    { name: 'Mchele', variant: 'mfuko 25kg', category: 'Vyakula', unit: 'kipande', icon: 'wheat', price: 70000, cost: 63000 },
    { name: 'Mafuta ya kupikia', variant: 'dumu 20L', category: 'Vyakula', unit: 'kipande', icon: 'droplet', price: 95000, cost: 87000 },
    { name: 'Sabuni', variant: 'katoni', category: 'Usafi', unit: 'kipande', icon: 'droplets', price: 55000, cost: 50000 },
    { name: 'Soda', variant: 'kreti', category: 'Vinywaji', unit: 'kipande', icon: 'cup-soda', price: 18000, cost: 16500 },
  ],
  services: [
    { name: 'Huduma', category: 'Huduma', unit: 'kipande', icon: 'wrench', price: 10000, cost: 0 },
    { name: 'Ushauri', category: 'Huduma', unit: 'kipande', icon: 'message-circle', price: 20000, cost: 0 },
    { name: 'Usafiri', category: 'Huduma', unit: 'kipande', icon: 'bike', price: 5000, cost: 2000 },
  ],
  other: [{ name: 'Bidhaa', unit: 'kipande', icon: 'package', price: 1000, cost: 700 }],
};

/** The picture for a product that has none, by shop type. */
export const TYPE_ICON: Record<BusinessType, string> = {
  cosmetics: 'sparkles',
  clothes: 'shirt',
  hardware: 'wrench',
  duka: 'shopping-basket',
  genge: 'salad',
  pharmacy: 'pill',
  wholesale: 'package',
  services: 'wrench',
  other: 'package',
};

/**
 * Pictures by category name, so a product typed in bulk ("Losheni",
 * "Viatu", "Rangi") gets a fitting picture instead of a cardboard box.
 * Matched on the start of the category, case-insensitively.
 */
const CATEGORY_ICONS: [RegExp, string][] = [
  [/^(mafuta ya ngozi|losheni|lotion|cream|krimu)/i, 'droplet'],
  [/^(make-?up|vipodozi)/i, 'sparkles'],
  [/^(manukato|perfume|marashi)/i, 'flower'],
  [/^(sabuni|soap|usafi)/i, 'droplets'],
  [/^(nywele|hair|wigi)/i, 'scissors'],
  [/^(kucha|nail)/i, 'paintbrush'],
  [/^(magauni|gauni|dress)/i, 'shirt'],
  [/^(mashati|shati|shirt|t-?shirt)/i, 'shirt'],
  [/^(suruali|jeans|trouser)/i, 'shirt'],
  [/^(viatu|shoe|raba|sendozi)/i, 'footprints'],
  [/^(mikoba|mkoba|bag)/i, 'shopping-bag'],
  [/^(vito|jewel|hereni|bangili)/i, 'gem'],
  [/^(nguo za watoto|watoto|kids)/i, 'gift'],
  [/^(saruji|cement)/i, 'brick-wall'],
  [/^(nondo|chuma|steel)/i, 'construction'],
  [/^(mabati|bati|roofing)/i, 'house'],
  [/^(misumari|skrubu|nail|screw)/i, 'bolt'],
  [/^(rangi|paint)/i, 'paint-bucket'],
  [/^(bomba|maji|plumb)/i, 'cylinder'],
  [/^(umeme|electric|waya)/i, 'zap'],
  [/^(zana|tools?)/i, 'hammer'],
  [/^(mbao|timber|wood)/i, 'tree-pine'],
  [/^(dawa|antibiotik|medicine)/i, 'pill'],
  [/^(vitamini|vitamin)/i, 'citrus'],
  [/^(vifaa tiba|medical)/i, 'stethoscope'],
  [/^(vyakula|food)/i, 'wheat'],
  [/^(vinywaji|drinks?)/i, 'cup-soda'],
  [/^(vocha|airtime)/i, 'smartphone'],
  [/^(huduma|service)/i, 'wrench'],
];

export function iconFor(type: BusinessType | null | undefined, category?: string | null): string {
  const name = category?.trim();
  if (name) for (const [pattern, icon] of CATEGORY_ICONS) if (pattern.test(name)) return icon;
  return TYPE_ICON[type ?? 'other'] ?? 'package';
}

/** Pictures offered in the product editor (lib/product-icons.ts names): this trade's first, then the rest. */
const ICONS_BY_TYPE: Record<BusinessType, readonly string[]> = {
  cosmetics: ['sparkles', 'droplet', 'box', 'droplets', 'paintbrush', 'flower', 'smile', 'scissors', 'spray-can', 'eye'],
  clothes: ['shirt', 'footprints', 'shopping-bag', 'backpack', 'tag', 'ribbon', 'gem', 'watch', 'glasses', 'gift'],
  hardware: ['brick-wall', 'construction', 'house', 'bolt', 'paint-bucket', 'cylinder', 'zap', 'lightbulb', 'hammer', 'wrench', 'axe', 'lock', 'tree-pine', 'toolbox'],
  duka: ['wheat', 'droplet', 'box', 'coffee', 'egg', 'milk', 'croissant', 'droplets', 'glass-water', 'cup-soda', 'smartphone', 'flame', 'package'],
  genge: ['cherry', 'sprout', 'salad', 'leaf', 'banana', 'carrot', 'nut', 'citrus', 'apple', 'flame', 'bean', 'fish', 'drumstick'],
  pharmacy: ['pill', 'cup-soda', 'bandage', 'droplet', 'hand', 'thermometer', 'stethoscope', 'syringe', 'citrus', 'droplets'],
  wholesale: ['package', 'wheat', 'droplet', 'droplets', 'cup-soda', 'glass-water', 'box'],
  services: ['wrench', 'message-circle', 'bike', 'scissors', 'camera', 'printer', 'car', 'brush'],
  other: ['package'],
};

export function iconsFor(type: BusinessType | null | undefined): string[] {
  const own = ICONS_BY_TYPE[type ?? 'other'] ?? [];
  const rest = Object.values(ICONS_BY_TYPE).flat();
  return [...new Set([...own, ...rest])];
}
