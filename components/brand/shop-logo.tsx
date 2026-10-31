/* eslint-disable @next/next/no-img-element -- a static export has no image optimiser, and the logo is tiny or inline */

/**
 * The shop's own logo, when the operator has set one. Renders nothing
 * otherwise, so screens can drop it in unconditionally.
 */
export function ShopLogo({ src, size = 32, className }: { src?: string | null; size?: number; className?: string }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className ?? 'shrink-0 rounded-[8px] bg-white object-contain'}
      style={{ width: size, height: size }}
    />
  );
}
