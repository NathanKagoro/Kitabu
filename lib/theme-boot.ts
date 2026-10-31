/**
 * Shared by the server layout and the client theme code, so no 'use client'
 * here: a server component would otherwise get a client reference, not the
 * string.
 */
export const THEME_KEY = 'kitabu.theme';

/**
 * Runs in <head> before anything paints: sets html[data-theme] to light or
 * dark. Light unless this phone chose dark, or chose to follow the phone's own
 * setting and the phone is in dark mode. Keep it tiny and dependency-free.
 */
export const THEME_BOOT_SCRIPT = `try{var p=localStorage.getItem('${THEME_KEY}');var d=p==='dark'||(p==='system'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light')}catch(e){}`;
