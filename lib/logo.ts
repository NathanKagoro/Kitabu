'use client';

import { MAX_LOGO_CHARS } from '@/supabase/functions/accounts/rules';

/**
 * A picked image file -> a small square-fitted WebP (PNG where WebP isn't
 * supported) as a data URL, so the logo works offline and on receipts with no
 * storage bucket. Throws 'too_big' if even the small version exceeds the cap.
 */
export async function shrinkLogo(file: File, size = 256): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('unreadable'));
      img.src = url;
    });
    const scale = Math.min(1, size / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(image, 0, 0, width, height);
    for (const quality of [0.85, 0.7, 0.5]) {
      const webp = canvas.toDataURL('image/webp', quality);
      const data = webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
      if (data.length <= MAX_LOGO_CHARS) return data;
    }
    throw new Error('too_big');
  } finally {
    URL.revokeObjectURL(url);
  }
}
