/**
 * Shared by the server layout and the client theme code, so no 'use client'
 * here: a server component would otherwise get a client reference, not the
 * string.
 */
export const THEME_KEY = 'kitabu.theme';

/** Runs in <head> before anything paints. Keep it tiny and dependency-free. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;
