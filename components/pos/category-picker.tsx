'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { ChevronDown } from '@/components/icons';
import { cn } from '@/lib/cn';

// The sheet loads on first open; the sales screen's first load stays small.
const CategorySheet = dynamic(() => import('@/components/pos/category-sheet').then((m) => m.CategorySheet));

/**
 * Choosing a category: one button that says which is showing, opening a sheet
 * with every category as a large tile. Replaces a row of chips that slid off
 * the side of the screen.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  className,
}: {
  categories: readonly string[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}) {
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const pick = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn('flex h-12 w-full items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 text-left', className)}
      >
        <span className="text-sm text-ink-soft">{t('categoryLabel')}</span>
        <span className="min-w-0 flex-1 truncate font-semibold">{value ?? tc('all')}</span>
        <ChevronDown size={20} className="text-ink-faint" />
      </button>
      {open ? <CategorySheet categories={categories} value={value} onPick={pick} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
