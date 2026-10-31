'use client';

import { useEffect, useState } from 'react';

import { THEME_KEY } from './theme-boot';

/**
 * Light or dark, per phone. Light unless the person picks dark, or picks
 * "like the phone" ('system'). Kept in localStorage (not the synced database):
 * it's how this phone looks, not a shop setting, and it must be readable
 * before React starts so the first paint is already right (lib/theme-boot.ts).
 * html[data-theme] always holds what is showing, 'light' or 'dark'.
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const CHANGE_EVENT = 'kitabu-theme-change';

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'system' ? value : 'light';
  } catch {
    return 'light';
  }
}

const phoneIsDark = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') return phoneIsDark() ? 'dark' : 'light';
  return preference;
}

function apply(preference: ThemePreference): void {
  document.documentElement.setAttribute('data-theme', resolve(preference));
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'light') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Private mode or storage full: the choice lasts until the page reloads.
  }
  apply(preference);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** The person's choice and what is actually showing, kept live. */
export function useTheme(): { preference: ThemePreference; resolved: ResolvedTheme } {
  const [preference, setPreference] = useState<ThemePreference>('light');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  useEffect(() => {
    const update = () => {
      const p = readThemePreference();
      apply(p);
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
