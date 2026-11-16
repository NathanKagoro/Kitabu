import type { StarterProduct } from './onboarding/starter-products';
import type { BusinessType, ExpenseCategory } from './types';

/**
 * The demo shops' fuller shelves, customers and suppliers. Onboarding still
 * offers the short starter lists (lib/onboarding/starter-products.ts); a demo
 * adds these so a hardware shop looks like a hardware shop, with typical Dar
 * prices (TZS, late 2026).
 *
 * `w` is how often a line sells compared with an ordinary one (cement and
 * nails sell all day, a water tank now and then), and `qty` how many go in
 * one sale (metres of cable, kilos of sugar).
 */
export interface DemoProduct extends StarterProduct {
  w?: number;
  qty?: [number, number];
}

const M = { unit: 'custom' as const, unitLabel: 'mita' };

export const EXTRA_PRODUCTS: Partial<Record<BusinessType, readonly DemoProduct[]>> = {
  hardware: [
    { name: 'Saruji', variant: 'Twiga 42.5', category: 'Saruji', unit: 'kipande', icon: 'brick-wall', price: 18500, cost: 16400, w: 4, qty: [1, 10] },
    { name: 'Saruji', variant: 'Dangote 32.5', category: 'Saruji', unit: 'kipande', icon: 'brick-wall', price: 16500, cost: 14700, w: 3, qty: [1, 10] },
    { name: 'Gypsum', variant: '25kg', category: 'Saruji', unit: 'kipande', icon: 'brick-wall', price: 9500, cost: 7600, qty: [1, 4] },
    { name: 'Nondo', variant: '10mm', category: 'Nondo na chuma', unit: 'kipande', icon: 'construction', price: 19000, cost: 16800, w: 2, qty: [1, 12] },
    { name: 'Nondo', variant: '16mm', category: 'Nondo na chuma', unit: 'kipande', icon: 'construction', price: 42000, cost: 37500, qty: [1, 6] },
    { name: 'Waya wa kufunga', category: 'Nondo na chuma', unit: 'kg', icon: 'construction', price: 6000, cost: 4700, qty: [1, 5] },
    { name: 'Bati', variant: 'Gauge 28', category: 'Mabati', unit: 'kipande', icon: 'house', price: 27000, cost: 23800, w: 2, qty: [1, 12] },
    { name: 'Bati la rangi', variant: 'Msouth · Nyekundu', category: 'Mabati', unit: 'kipande', icon: 'house', price: 32000, cost: 28000, qty: [2, 15] },
    { name: 'Kofia ya bati', variant: 'Ridge', category: 'Mabati', unit: 'kipande', icon: 'house', price: 12000, cost: 9800, qty: [1, 4] },
    { name: 'Misumari', variant: '4 inchi', category: 'Misumari na skrubu', unit: 'kg', icon: 'bolt', price: 4500, cost: 3500, w: 3, qty: [1, 5] },
    { name: 'Misumari ya bati', category: 'Misumari na skrubu', unit: 'kg', icon: 'bolt', price: 6500, cost: 5100, w: 2, qty: [1, 3] },
    { name: 'Skrubu', variant: 'boksi 100', category: 'Misumari na skrubu', unit: 'kipande', icon: 'bolt', price: 8000, cost: 5900 },
    { name: 'Rangi ya maji', variant: '4L · Nyeupe', category: 'Rangi', unit: 'kipande', icon: 'paint-bucket', price: 22000, cost: 17500, w: 2 },
    { name: 'Rangi ya mafuta', variant: '4L · Kijivu', category: 'Rangi', unit: 'kipande', icon: 'paint-bucket', price: 38000, cost: 31000 },
    { name: 'Thinner', variant: '1L', category: 'Rangi', unit: 'kipande', icon: 'paint-bucket', price: 7000, cost: 5200, qty: [1, 3] },
    { name: 'Brashi', variant: '3 inchi', category: 'Rangi', unit: 'kipande', icon: 'paint-bucket', price: 4000, cost: 2700, w: 2 },
    { name: 'Roller', variant: '9 inchi', category: 'Rangi', unit: 'kipande', icon: 'paint-bucket', price: 9000, cost: 6400 },
    { name: 'Bomba la PVC', variant: '3/4 inchi', category: 'Bomba na maji', unit: 'kipande', icon: 'cylinder', price: 12000, cost: 9300, qty: [1, 6] },
    { name: 'Koki ya maji', category: 'Bomba na maji', unit: 'kipande', icon: 'cylinder', price: 12000, cost: 8400 },
    { name: 'Gundi ya PVC', variant: '250ml', category: 'Bomba na maji', unit: 'kipande', icon: 'cylinder', price: 6500, cost: 4700 },
    { name: 'Kiungio', variant: 'Elbow 1/2', category: 'Bomba na maji', unit: 'kipande', icon: 'cylinder', price: 1000, cost: 550, w: 2, qty: [2, 8] },
    { name: 'Tanki la maji', variant: '1000L', category: 'Bomba na maji', unit: 'kipande', icon: 'cylinder', price: 285000, cost: 245000, w: 0.15 },
    { name: 'Waya wa umeme', variant: '1.5mm', category: 'Umeme', ...M, icon: 'zap', price: 1000, cost: 700, w: 2, qty: [5, 30] },
    { name: 'Swichi', category: 'Umeme', unit: 'kipande', icon: 'zap', price: 3500, cost: 2200, qty: [1, 4] },
    { name: 'Soketi', category: 'Umeme', unit: 'kipande', icon: 'zap', price: 6000, cost: 4100, qty: [1, 3] },
    { name: 'Balbu ya LED', variant: '12W', category: 'Umeme', unit: 'kipande', icon: 'lightbulb', price: 3500, cost: 2100, w: 2, qty: [1, 6] },
    { name: 'Breaker', variant: '20A', category: 'Umeme', unit: 'kipande', icon: 'zap', price: 15000, cost: 10800 },
    { name: 'Kipimo cha tepu', variant: '5m', category: 'Zana', unit: 'kipande', icon: 'wrench', price: 8000, cost: 5300 },
    { name: 'Sepetu', category: 'Zana', unit: 'kipande', icon: 'wrench', price: 14000, cost: 9800 },
    { name: 'Msumeno', category: 'Zana', unit: 'kipande', icon: 'axe', price: 18000, cost: 12600 },
    { name: 'Toroli', category: 'Zana', unit: 'kipande', icon: 'toolbox', price: 150000, cost: 124000, w: 0.2 },
    { name: 'Mbao', variant: '2x4 futi 12', category: 'Mbao', unit: 'kipande', icon: 'tree-pine', price: 9500, cost: 7600, w: 2, qty: [2, 20] },
    { name: 'Plywood', variant: '18mm', category: 'Mbao', unit: 'kipande', icon: 'tree-pine', price: 68000, cost: 57500, w: 0.5 },
  ],
  duka: [
    { name: 'Sukari', variant: 'Kilombero', category: 'Vyakula', unit: 'kg', icon: 'wheat', price: 3300, cost: 2900, w: 4, qty: [1, 3] },
    { name: 'Unga wa ngano', variant: 'Azam 2kg', category: 'Vyakula', unit: 'kipande', icon: 'wheat', price: 4500, cost: 3900, w: 2 },
    { name: 'Maharage', category: 'Vyakula', unit: 'kg', icon: 'wheat', price: 3500, cost: 2900, w: 2, qty: [1, 2] },
    { name: 'Tambi', variant: 'Santa Lucia', category: 'Vyakula', unit: 'pakti', icon: 'box', price: 1500, cost: 1150, w: 2 },
    { name: 'Mayai', category: 'Vyakula', unit: 'kipande', icon: 'egg', price: 450, cost: 360, w: 3, qty: [2, 10] },
    { name: 'Maziwa', variant: 'Tanga Fresh 500ml', category: 'Vinywaji', unit: 'kipande', icon: 'milk', price: 1500, cost: 1200, w: 2 },
    { name: 'Mkate', variant: 'Azam', category: 'Vyakula', unit: 'kipande', icon: 'croissant', price: 2500, cost: 2100, w: 3 },
    { name: 'Siagi', variant: 'Blue Band 250g', category: 'Vyakula', unit: 'kipande', icon: 'box', price: 3500, cost: 2900 },
    { name: 'Majani ya chai', variant: 'Simba 100g', category: 'Vyakula', unit: 'pakti', icon: 'coffee', price: 2000, cost: 1550 },
    { name: 'Kahawa', variant: 'Africafe 50g', category: 'Vyakula', unit: 'pakti', icon: 'coffee', price: 3500, cost: 2800 },
    { name: 'Biskuti', variant: 'Marie', category: 'Vyakula', unit: 'pakti', icon: 'box', price: 1000, cost: 750, w: 2 },
    { name: 'Juisi', variant: 'Azam Embe 350ml', category: 'Vinywaji', unit: 'kipande', icon: 'cup-soda', price: 1000, cost: 780, w: 2 },
    { name: 'Soda', variant: 'Coca-Cola 500ml', category: 'Vinywaji', unit: 'kipande', icon: 'cup-soda', price: 1200, cost: 950, w: 3 },
    { name: 'Maji', variant: 'Kilimanjaro 1.5L', category: 'Vinywaji', unit: 'kipande', icon: 'glass-water', price: 1200, cost: 900, w: 2 },
    { name: 'Sabuni ya unga', variant: 'Omo 500g', category: 'Usafi', unit: 'pakti', icon: 'droplets', price: 3000, cost: 2450, w: 2 },
    { name: 'Dawa ya meno', variant: 'Colgate', category: 'Usafi', unit: 'kipande', icon: 'droplets', price: 2500, cost: 1950 },
    { name: 'Pedi', variant: 'Always', category: 'Usafi', unit: 'pakti', icon: 'droplets', price: 3000, cost: 2350 },
    { name: 'Karatasi ya chooni', category: 'Usafi', unit: 'kipande', icon: 'box', price: 800, cost: 600, w: 2, qty: [1, 4] },
    { name: 'Kiberiti', category: 'Vingine', unit: 'pakti', icon: 'flame', price: 200, cost: 140, w: 2 },
    { name: 'Mshumaa', category: 'Vingine', unit: 'kipande', icon: 'flame', price: 300, cost: 200 },
    { name: 'Mafuta ya taa', category: 'Vingine', unit: 'lita', icon: 'droplet', price: 3200, cost: 2800 },
    { name: 'Mkaa', variant: 'ndoo', category: 'Vingine', unit: 'kipande', icon: 'flame', price: 3000, cost: 2200, w: 2 },
    { name: 'Vocha', variant: 'Vodacom 2000', category: 'Vocha', unit: 'kipande', icon: 'smartphone', price: 2000, cost: 1900, w: 2 },
    { name: 'Vocha', variant: 'Airtel 1000', category: 'Vocha', unit: 'kipande', icon: 'smartphone', price: 1000, cost: 950 },
  ],
  wholesale: [
    { name: 'Sukari', variant: 'mfuko 25kg', category: 'Vyakula', unit: 'kipande', icon: 'wheat', price: 76000, cost: 71000, w: 3 },
    { name: 'Mchele', variant: 'Kyela 25kg', category: 'Vyakula', unit: 'kipande', icon: 'wheat', price: 82000, cost: 74500, w: 2 },
    { name: 'Maharage', variant: 'gunia 50kg', category: 'Vyakula', unit: 'kipande', icon: 'wheat', price: 160000, cost: 147000 },
    { name: 'Mafuta ya kupikia', variant: 'katoni 12x1L', category: 'Vyakula', unit: 'kipande', icon: 'droplet', price: 62000, cost: 57000, w: 2 },
    { name: 'Tambi', variant: 'Santa Lucia katoni', category: 'Vyakula', unit: 'kipande', icon: 'box', price: 32000, cost: 29000 },
    { name: 'Biskuti', variant: 'Marie katoni', category: 'Vyakula', unit: 'kipande', icon: 'box', price: 28000, cost: 25000, w: 2 },
    { name: 'Juisi', variant: 'Azam katoni 24', category: 'Vinywaji', unit: 'kipande', icon: 'cup-soda', price: 21000, cost: 18800, w: 2 },
    { name: 'Maji', variant: 'Kilimanjaro katoni 6x1.5L', category: 'Vinywaji', unit: 'kipande', icon: 'glass-water', price: 6200, cost: 5300, w: 2 },
    { name: 'Sabuni ya unga', variant: 'Omo katoni 20', category: 'Usafi', unit: 'kipande', icon: 'droplets', price: 56000, cost: 51500 },
    { name: 'Sabuni ya kipande', variant: 'Jamaa katoni', category: 'Usafi', unit: 'kipande', icon: 'droplets', price: 38000, cost: 34500, w: 2 },
    { name: 'Karatasi ya chooni', variant: 'bando 40', category: 'Usafi', unit: 'kipande', icon: 'box', price: 26000, cost: 23000 },
    { name: 'Kiberiti', variant: 'bando 100', category: 'Vingine', unit: 'kipande', icon: 'box', price: 15000, cost: 13200 },
    { name: 'Mshumaa', variant: 'katoni', category: 'Vingine', unit: 'kipande', icon: 'box', price: 24000, cost: 21500 },
  ],
  clothes: [
    { name: 'Gauni la kitenge', variant: 'S', category: 'Magauni', unit: 'kipande', icon: 'shirt', price: 35000, cost: 22000, w: 2 },
    { name: 'Gauni la kitenge', variant: 'XL', category: 'Magauni', unit: 'kipande', icon: 'shirt', price: 38000, cost: 24000 },
    { name: 'Gauni la jioni', variant: 'M · Nyeusi', category: 'Magauni', unit: 'kipande', icon: 'shirt', price: 65000, cost: 40000, w: 0.6 },
    { name: 'Kitenge', variant: 'doti 6 yadi', category: 'Magauni', unit: 'kipande', icon: 'shirt', price: 28000, cost: 18000, w: 3 },
    { name: 'Kanga', variant: 'doti', category: 'Magauni', unit: 'kipande', icon: 'shirt', price: 15000, cost: 9500, w: 3 },
    { name: 'Shati la mikono mifupi', variant: 'M · Nyeupe', category: 'Mashati', unit: 'kipande', icon: 'shirt', price: 20000, cost: 12000, w: 2 },
    { name: 'Shati la mikono mirefu', variant: 'XL · Kijivu', category: 'Mashati', unit: 'kipande', icon: 'shirt', price: 25000, cost: 15000 },
    { name: 'T-shirt', variant: 'L', category: 'Mashati', unit: 'kipande', icon: 'shirt', price: 12000, cost: 6500, w: 3, qty: [1, 3] },
    { name: 'Jeans', variant: '30', category: 'Suruali', unit: 'kipande', icon: 'shirt', price: 30000, cost: 18000, w: 2 },
    { name: 'Jeans', variant: '34', category: 'Suruali', unit: 'kipande', icon: 'shirt', price: 30000, cost: 18000, w: 2 },
    { name: 'Suruali ya kitambaa', variant: '32 · Nyeusi', category: 'Suruali', unit: 'kipande', icon: 'shirt', price: 28000, cost: 17000 },
    { name: 'Raba', variant: '40', category: 'Viatu', unit: 'custom', unitLabel: 'jozi', icon: 'footprints', price: 45000, cost: 30000 },
    { name: 'Raba', variant: '44', category: 'Viatu', unit: 'custom', unitLabel: 'jozi', icon: 'footprints', price: 45000, cost: 30000 },
    { name: 'Viatu vya ofisi', variant: '42 · Kahawia', category: 'Viatu', unit: 'custom', unitLabel: 'jozi', icon: 'footprints', price: 60000, cost: 38000, w: 0.6 },
    { name: 'Sendozi', variant: '40', category: 'Viatu', unit: 'custom', unitLabel: 'jozi', icon: 'footprints', price: 20000, cost: 12000, w: 2 },
    { name: 'Mkoba wa bega', category: 'Mikoba', unit: 'kipande', icon: 'shopping-bag', price: 35000, cost: 21000 },
    { name: 'Pochi', category: 'Mikoba', unit: 'kipande', icon: 'shopping-bag', price: 15000, cost: 8500, w: 2 },
    { name: 'Mkufu', category: 'Vito', unit: 'kipande', icon: 'gem', price: 8000, cost: 4000, w: 2 },
    { name: 'Saa ya mkono', category: 'Vito', unit: 'kipande', icon: 'watch', price: 25000, cost: 14000 },
    { name: 'Nguo ya mtoto', variant: '4–5 yrs', category: 'Nguo za watoto', unit: 'kipande', icon: 'gift', price: 14000, cost: 8000, w: 2 },
    { name: 'Viatu vya mtoto', variant: '28', category: 'Nguo za watoto', unit: 'custom', unitLabel: 'jozi', icon: 'footprints', price: 18000, cost: 10500 },
  ],
};

/** Popular lines in the short starter lists, by name: the anchors of each shop. */
export const STARTER_WEIGHT: Partial<Record<BusinessType, Record<string, number>>> = {
  hardware: { Saruji: 4, Nondo: 2, Bati: 2, Misumari: 3, 'Waya wa umeme': 2, 'Bomba la PVC': 2 },
  duka: { Sukari: 3, Mchele: 3, 'Unga wa sembe': 4, 'Mafuta ya kupikia': 3, Soda: 2, 'Maji ya kunywa': 2, Vocha: 3 },
  wholesale: { Sukari: 3, Mchele: 2, 'Mafuta ya kupikia': 2, Soda: 2, 'Unga wa sembe': 3 },
  clothes: { 'Gauni la kitenge': 2, Jeans: 2 },
};

export interface DemoPerson {
  name: string;
  phone: string | null;
}

/** Who buys on account depends on the trade: fundis and builders at a hardware, small shops at a wholesaler. */
export const DEMO_CUSTOMERS: Partial<Record<BusinessType, readonly DemoPerson[]>> & { default: readonly DemoPerson[] } = {
  default: [
    { name: 'Mama Asha', phone: '0713 222 111' },
    { name: 'Baba Juma', phone: '0754 333 444' },
    { name: 'Bi. Rehema', phone: '0689 555 666' },
    { name: 'Neema Mushi', phone: '0765 777 888' },
    { name: 'Mzee Hamisi', phone: null },
    { name: 'Dada Zuhura', phone: '0712 404 515' },
    { name: 'Kaka Hassani', phone: '0744 818 202' },
    { name: 'Mama Upendo', phone: '0657 330 761' },
    { name: 'Fundi Selemani', phone: '0716 902 334' },
    { name: 'Bi. Mwanaisha', phone: null },
  ],
  hardware: [
    { name: 'Fundi Ally', phone: '0713 410 220' },
    { name: 'Msasani Builders', phone: '0754 880 101' },
    { name: 'Fundi Peter', phone: '0689 300 452' },
    { name: 'Mama Neema (anajenga)', phone: '0765 212 909' },
    { name: 'Mzee Hamisi', phone: null },
    { name: 'Kimara Construction', phone: '0767 455 120' },
    { name: 'Fundi Rajabu (umeme)', phone: '0715 600 819' },
    { name: 'Shule ya Msingi Mbezi', phone: '0786 221 430' },
    { name: 'Fundi Joseph (bomba)', phone: '0742 118 906' },
    { name: 'Bw. Mushi', phone: '0754 991 277' },
    { name: 'Kanisa la Tegeta', phone: '0713 676 004' },
    { name: 'Fundi Said', phone: null },
  ],
  wholesale: [
    { name: 'Duka la Mama Asha', phone: '0713 222 111' },
    { name: 'Upendo Mini Supermarket', phone: '0754 610 330' },
    { name: 'Genge la Bakari', phone: '0689 145 870' },
    { name: 'Kibanda cha Rehema', phone: '0765 777 888' },
    { name: 'Hoteli ya Faraji', phone: '0712 909 404' },
    { name: 'Duka la Kimara Mwisho', phone: '0744 302 516' },
    { name: 'Mgahawa wa Mama Lishe', phone: '0657 117 845' },
    { name: 'Shule ya Sekondari Kibaha', phone: '0786 450 220' },
    { name: 'Duka la Baraka (Mbezi)', phone: '0716 233 908' },
    { name: 'Canteen ya Kiwanda', phone: '0767 880 412' },
  ],
  clothes: [
    { name: 'Dada Zuhura', phone: '0712 404 515' },
    { name: 'Mama Upendo', phone: '0657 330 761' },
    { name: 'Bi. Mwanaisha', phone: '0754 120 377' },
    { name: 'Grace Mrema', phone: '0765 448 210' },
    { name: 'Anna Massawe', phone: '0713 906 552' },
    { name: 'Rose (saluni)', phone: '0689 223 017' },
    { name: 'Mama Joyce', phone: null },
    { name: 'Kaka Hassani', phone: '0744 818 202' },
  ],
};

/** Where each trade buys its stock. */
export const DEMO_SUPPLIERS: Partial<Record<BusinessType, readonly DemoPerson[]>> & { default: readonly DemoPerson[] } = {
  default: [
    { name: 'Kariakoo Jumla', phone: '0713 550 120' },
    { name: 'Azam Distributors', phone: '0754 300 888' },
    { name: 'Msambazaji wa vinywaji', phone: '0689 707 343' },
  ],
  hardware: [
    { name: 'Twiga Cement (wakala)', phone: '0713 550 120' },
    { name: 'Kariakoo Steel & Hardware', phone: '0754 300 888' },
    { name: 'ALAF Mabati (Mbezi)', phone: '0689 707 343' },
    { name: 'Umeme Supplies Gerezani', phone: '0767 210 554' },
  ],
  wholesale: [
    { name: 'Bakhresa (Azam) Depo', phone: '0713 550 120' },
    { name: 'Kilombero Sugar wakala', phone: '0754 300 888' },
    { name: 'Coca-Cola Kwanza depo', phone: '0689 707 343' },
    { name: 'Unilever msambazaji', phone: '0767 210 554' },
  ],
  clothes: [
    { name: 'Kariakoo Mitumba Jumla', phone: '0713 550 120' },
    { name: 'Vitenge vya Kongo (Uhuru St)', phone: '0754 300 888' },
    { name: 'Viatu Jumla Kariakoo', phone: '0689 707 343' },
  ],
};

/** Running costs by trade: rent on the 1st, power and the guard weekly, lunch most days, transport now and then. */
export interface ExpensePlan {
  rent: number;
  power: number;
  guard: number;
  lunch: number;
  transport: number;
  levy: number;
  /** Monthly pay per member of staff, paid on the last day of the month. */
  wage: number;
}
export const EXPENSES: Partial<Record<BusinessType, ExpensePlan>> & { default: ExpensePlan } = {
  default: { rent: 150_000, power: 15_000, guard: 0, lunch: 4_000, transport: 3_000, levy: 10_000, wage: 150_000 },
  hardware: { rent: 450_000, power: 25_000, guard: 30_000, lunch: 9_000, transport: 8_000, levy: 25_000, wage: 280_000 },
  wholesale: { rent: 600_000, power: 30_000, guard: 35_000, lunch: 9_000, transport: 15_000, levy: 30_000, wage: 300_000 },
  clothes: { rent: 300_000, power: 15_000, guard: 0, lunch: 6_000, transport: 5_000, levy: 15_000, wage: 220_000 },
};

export const EXPENSE_CATEGORY: Record<keyof Omit<ExpensePlan, 'wage'> | 'wage', ExpenseCategory> = {
  rent: 'kodi',
  power: 'umeme',
  guard: 'nyingine',
  lunch: 'chakula',
  transport: 'nauli',
  levy: 'ushuru',
  wage: 'mishahara',
};

/** Busier at the weekend, quiet on Sunday afternoon: Monday first, Sunday last. */
export const WEEKDAY_PACE = [0.9, 0.95, 1, 1, 1.15, 1.35, 0.6] as const;
