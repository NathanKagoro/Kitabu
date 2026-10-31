import { describe, expect, it } from 'vitest';

import { brandShades, contrast, ensureContrast, parseHex, SURFACES, toHex } from '@/lib/color';

const c = (hex: string) => parseHex(hex)!;

describe('colour maths', () => {
  it('reads and writes hex', () => {
    expect(parseHex('#0f6b3f')).toEqual([15, 107, 63]);
    expect(parseHex('nope')).toBeNull();
    expect(toHex([15, 107, 63])).toBe('#0f6b3f');
  });

  it('measures contrast the WCAG way', () => {
    expect(contrast(c('#ffffff'), c('#000000'))).toBeCloseTo(21, 0);
    expect(contrast(c('#777777'), c('#ffffff'))).toBeCloseTo(4.48, 1);
  });

  it('leaves a passing colour alone and moves a failing one just far enough', () => {
    expect(ensureContrast(c('#0f6b3f'), c('#ffffff'), 4.5, [0, 0, 0])).toEqual(c('#0f6b3f'));
    const fixed = ensureContrast(c('#f5d000'), c('#ffffff'), 4.5, [0, 0, 0]);
    expect(contrast(fixed, c('#ffffff'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('any shop colour stays readable in both modes', () => {
  // Including the awkward ones an owner might pick: yellow, pale pink, near-black.
  const picks = ['#0f6b3f', '#f5d000', '#ffc0cb', '#111111', '#c8211e', '#2a6fdb', '#ffffff'];

  it.each(picks)('%s: white text on light-mode buttons, brand text on white', (hex) => {
    const { light } = brandShades(hex);
    expect(contrast(c(light.brand), SURFACES.light.onFill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c(light.brand), SURFACES.light.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c(light.brandDark), c(light.brandTint))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(picks)('%s: dark text on dark-mode buttons, brand text on the dark surface', (hex) => {
    const { dark } = brandShades(hex);
    expect(contrast(c(dark.brand), SURFACES.dark.onFill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c(dark.brand), SURFACES.dark.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c(dark.brandDark), c(dark.brandTint))).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the default green as it is in light mode", () => {
    expect(brandShades('#0f6b3f').light.brand).toBe('#0f6b3f');
  });
});
