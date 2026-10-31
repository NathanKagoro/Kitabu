'use client';

import { useEffect, useState } from 'react';

import { THEME_KEY } from './theme-boot';

/**
 * Light or dark, per phone. "system" follows the phone's own setting. Kept in
 * localStorage (not the synced database): it's how this phone looks, not a shop
 * setting, and it must be readable before React starts so the first paint is
 * already in the right mode (see lib/theme-boot.ts).
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const CHANGE_EVENT = 'kitabu-theme-change';

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Private mode or storage full: the choice lasts until the page reloads.
  }
  const root = document.documentElement;
  if (preference === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', preference);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** The person's choice and what is actually showing, kept live. */
export function useTheme(): { preference: ThemePreference; resolved: ResolvedTheme } {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const update = () => {
      const p = readThemePreference();
      setPreference(p);
      setResolved(resolve(p));
    };
    update();
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', update);
    window.addEventListener(CHANGE_EVENT, update);
    return () => {
      media?.removeEventListener('change', update);
      window.removeEventListener(CHANGE_EVENT, update);
    };
  }, []);

  return { preference, resolved };
}
