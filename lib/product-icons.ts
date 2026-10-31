/**
 * Product pictures are named line icons, never emoji. The names are lucide
 * icon names; scripts/make-product-sprite.mjs draws exactly these into
 * public/product-icons.svg, one cached file with no JavaScript cost, and
 * <ProductIcon> shows them with <use>.
 *
 * Products saved before 0.6 hold an emoji in `icon`. LEGACY_EMOJI translates
 * those when shown, so old records on phones and the server need no migration
 * and an emoji is never drawn.
 */

// The sprite script reads this list: keep it a plain array of quoted names.
export const PRODUCT_ICON_KEYS = [
  'package', 'box', 'boxes', 'shopping-basket', 'shopping-bag', 'tag', 'gift',
  // cosmetics
  'sparkles', 'droplet', 'droplets', 'brush', 'paintbrush', 'flower', 'scissors', 'eye', 'spray-can', 'smile', 'heart',
  // clothes
  'shirt', 'footprints', 'backpack', 'gem', 'watch', 'glasses', 'ribbon', 'crown',
  // hardware
  'brick-wall', 'construction', 'house', 'bolt', 'nut', 'paint-bucket', 'paint-roller', 'cylinder', 'zap', 'lightbulb',
  'plug', 'cable', 'hammer', 'wrench', 'drill', 'axe', 'shovel', 'lock', 'key-round', 'tree-pine', 'toolbox', 'ruler', 'hard-hat',
  // food and drink
  'wheat', 'egg', 'milk', 'coffee', 'cup-soda', 'glass-water', 'croissant', 'candy', 'cookie', 'beef', 'fish', 'drumstick',
  'apple', 'banana', 'carrot', 'cherry', 'citrus', 'grape', 'salad', 'leaf', 'sprout', 'bean', 'flame',
  // pharmacy
  'pill', 'tablets', 'syringe', 'bandage', 'thermometer', 'stethoscope', 'hand', 'baby',
  // phones and services
  'smartphone', 'battery', 'message-circle', 'camera', 'printer', 'bike', 'car', 'fuel',
] as const;

export type ProductIconKey = (typeof PRODUCT_ICON_KEYS)[number];

export const DEFAULT_PRODUCT_ICON: ProductIconKey = 'package';

const KEYS = new Set<string>(PRODUCT_ICON_KEYS);

/** Every emoji a product could hold before 0.6 -> the icon shown instead. */
export const LEGACY_EMOJI: Record<string, ProductIconKey> = {
  '📦': 'package', '🛒': 'shopping-basket', '🫙': 'box', '🧂': 'box', '🧻': 'package', '🧸': 'gift',
  // cosmetics
  '💄': 'sparkles', '🧴': 'droplet', '🧼': 'droplets', '🫧': 'droplets', '💅': 'paintbrush', '🌸': 'flower',
  '🪞': 'smile', '💇': 'scissors', '🪮': 'scissors', '🧽': 'spray-can', '👁️': 'eye', '👁': 'eye',
  // clothes
  '👗': 'shirt', '👔': 'shirt', '👕': 'shirt', '👖': 'shirt', '🩳': 'shirt', '🧥': 'shirt',
  '👟': 'footprints', '👠': 'footprints', '👡': 'footprints', '🩴': 'footprints',
  '👜': 'shopping-bag', '🎒': 'backpack', '🧢': 'tag', '👒': 'tag', '🧣': 'ribbon', '💍': 'gem', '⌚': 'watch', '🕶️': 'glasses', '🕶': 'glasses',
  // hardware
  '🧱': 'brick-wall', '🏗️': 'construction', '🏗': 'construction', '🏠': 'house', '🔩': 'bolt', '🎨': 'paint-bucket',
  '🚰': 'cylinder', '⚡': 'zap', '💡': 'lightbulb', '🔨': 'hammer', '🪛': 'wrench', '🔧': 'wrench', '🪚': 'axe',
  '🔒': 'lock', '🪵': 'tree-pine', '🪜': 'construction', '🧰': 'toolbox',
  // food and drink
  '🍚': 'wheat', '🌾': 'wheat', '🌽': 'wheat', '🫗': 'droplet', '🍵': 'coffee', '☕': 'coffee', '🥚': 'egg', '🥛': 'milk',
  '🍞': 'croissant', '💧': 'glass-water', '🥤': 'cup-soda', '🧃': 'cup-soda', '🔥': 'flame', '🕯️': 'flame', '🕯': 'flame',
  '🍅': 'cherry', '🧅': 'sprout', '🥬': 'salad', '🌿': 'leaf', '🍌': 'banana', '🥔': 'sprout', '🥕': 'carrot', '🫑': 'salad',
  '🥥': 'nut', '🍋': 'citrus', '🍊': 'citrus', '🍍': 'citrus', '🥭': 'apple', '🍉': 'apple', '🥑': 'apple',
  '🌶️': 'flame', '🌶': 'flame', '🧄': 'sprout', '🫘': 'bean', '🐟': 'fish', '🍗': 'drumstick',
  // pharmacy
  '💊': 'pill', '🩹': 'bandage', '🧤': 'hand', '🌡️': 'thermometer', '🌡': 'thermometer', '🩺': 'stethoscope', '💉': 'syringe',
  // phones and services
  '📱': 'smartphone', '🛠️': 'wrench', '🛠': 'wrench', '💬': 'message-circle', '🛵': 'bike', '✂️': 'scissors', '✂': 'scissors',
  '📷': 'camera', '🖨️': 'printer', '🖨': 'printer', '🚗': 'car', '🧹': 'brush',
};

/** Whatever a product holds (icon name, old emoji, nothing) -> an icon to draw. */
export function productIconKey(stored: string | null | undefined): ProductIconKey {
  const value = stored?.trim();
  if (!value) return DEFAULT_PRODUCT_ICON;
  if (KEYS.has(value)) return value as ProductIconKey;
  return LEGACY_EMOJI[value] ?? LEGACY_EMOJI[value.replace(/️/g, '')] ?? DEFAULT_PRODUCT_ICON;
}

export function isProductIconKey(value: string): value is ProductIconKey {
  return KEYS.has(value);
}
