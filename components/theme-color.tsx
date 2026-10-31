'use client';

import { useEffect } from 'react';

import { useApp } from '@/components/app-provider';
import { brandShades } from '@/lib/color';
import { brandColorOf, DEFAULT_BRAND } from '@/lib/shop-config';
import { useTheme } from '@/lib/theme';

const DARK_PAPER = '#121411';

/**
 * Paints the app in the shop's own colour, in whichever mode is showing. Every
 * brand-coloured surface reads the --color-brand* variables, so setting three
 * of them on <html> is the whole theme. lib/color.ts derives the shades from
 * the one colour the operator picks and keeps every pairing readable (4.5:1),
 * so a shop that picks yellow still gets legible buttons.
 */
export function ThemeColor() {
  const { business } = useApp();
  const color = brandColorOf(business);
  const { resolved } = useTheme();

  useEffect(() => {
    const root = document.documentElement.style;
    if (color === DEFAULT_BRAND) {
      // The stylesheet already holds the default green for both modes.
      root.removeProperty('--color-brand');
      root.removeProperty('--color-brand-dark');
      root.removeProperty('--color-brand-tint');
    } else {
      const shades = brandShades(color)[resolved];
      root.setProperty('--color-brand', shades.brand);
      root.setProperty('--color-brand-dark', shades.brandDark);
      root.setProperty('--color-brand-tint', shades.brandTint);
    }
    const bar = resolved === 'dark' ? DARK_PAPER : brandShades(color).light.brand;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bar);
  }, [color, resolved]);

  return null;
}
