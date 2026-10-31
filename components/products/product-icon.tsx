import { withBase } from '@/lib/base-path';
import { cn } from '@/lib/cn';
import { productIconKey } from '@/lib/product-icons';

const SPRITE = withBase('/product-icons.svg');

/**
 * A product's picture: a line icon from public/product-icons.svg, in the
 * shop's colour on a soft tile. Old emoji values are translated
 * (lib/product-icons.ts), so an emoji is never drawn.
 */
export function ProductIcon({
  icon,
  size = 28,
  tile = true,
  className,
}: {
  icon: string | null | undefined;
  size?: number;
  /** Draw on a soft rounded tile (lists, till); off for inline use. */
  tile?: boolean;
  className?: string;
}) {
  const svg = (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <use href={`${SPRITE}#${productIconKey(icon)}`} />
    </svg>
  );
  if (!tile) return <span className={cn('inline-flex shrink-0 text-brand', className)}>{svg}</span>;
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-[10px] bg-brand-tint text-brand-dark', className)}
      style={{ width: size + 16, height: size + 16 }}
    >
      {svg}
    </span>
  );
}
