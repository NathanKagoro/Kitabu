/**
 * Colour maths for shop themes: any colour an operator picks must stay readable
 * in light and dark mode. Pure functions, unit-tested (tests/unit/color.test.ts).
 *
 * Contrast follows WCAG 2.x: 4.5:1 for normal text, which is also the floor we
 * keep for button labels on a brand fill.
 */

export type Rgb = readonly [number, number, number];

export function parseHex(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** `a` moved towards `b` by `t` (0..1), in sRGB, like CSS color-mix. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * The smallest move of `color` towards `towards` (black to darken, white to
 * lighten) that reaches `min` contrast against `against`. Returns the colour
 * unchanged when it already passes.
 */
export function ensureContrast(color: Rgb, against: Rgb, min: number, towards: Rgb): Rgb {
  if (contrast(color, against) >= min) return color;
  for (let step = 1; step <= 100; step++) {
    const next = mix(color, towards, step / 100);
    const rounded: Rgb = [Math.round(next[0]), Math.round(next[1]), Math.round(next[2])];
    if (contrast(rounded, against) >= min) return rounded;
  }
  return towards;
}

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

/** Surfaces the brand sits on; kept in step with app/globals.css. */
export const SURFACES = {
  light: { surface: parseHex('#ffffff')!, onFill: WHITE },
  dark: { surface: parseHex('#1b1e1a')!, onFill: parseHex('#10120f')! },
} as const;

export interface BrandShades {
  /** Fills (buttons, chips) and brand text. */
  brand: string;
  /** Pressed fills; also text placed on the tint. */
  brandDark: string;
  /** Soft background for selected and highlighted things. */
  brandTint: string;
}

/**
 * One picked colour -> readable shades for both modes.
 *
 * Light: the brand is darkened until white button text reads on it (4.5:1),
 * which also makes it readable as text on white.
 * Dark: the brand is lightened until it reads as text on the dark surface and
 * dark button text reads on it.
 */
export function brandShades(hex: string): { light: BrandShades; dark: BrandShades } {
  const base = parseHex(hex) ?? parseHex('#0f6b3f')!;

  const lightBrand = ensureContrast(base, SURFACES.light.onFill, 4.5, BLACK);
  const light: BrandShades = {
    brand: toHex(lightBrand),
    brandDark: toHex(mix(lightBrand, BLACK, 0.28)),
    brandTint: toHex(mix(lightBrand, SURFACES.light.surface, 0.88)),
  };

  const onSurface = ensureContrast(base, SURFACES.dark.surface, 4.5, WHITE);
  const darkBrand = ensureContrast(onSurface, SURFACES.dark.onFill, 4.5, WHITE);
  const darkTint = mix(darkBrand, SURFACES.dark.surface, 0.82);
  const dark: BrandShades = {
    brand: toHex(darkBrand),
    brandDark: toHex(ensureContrast(mix(darkBrand, WHITE, 0.3), darkTint, 4.5, WHITE)),
    brandTint: toHex(darkTint),
  };

  return { light, dark };
}
