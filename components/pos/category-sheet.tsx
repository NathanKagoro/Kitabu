'use client';

import { useTranslations } from 'next-intl';

import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';

/** Every category as a large tile, "all" first. Opened by CategoryPicker. */
export function CategorySheet({
  categories,
  value,
  onPick,
  onClose,
}: {
  categories: readonly string[];
  value: string | null;
  onPick: (value: string | null) => void;
  onClose: () => void;
}) {
  const t = useTranslations('products');
  const tc = useTranslations('common');
  return (
    <Sheet open onClose={onClose} title={t('categoryLabel')}>
      <div className="grid grid-cols-2 gap-2 p-4">
        {[null, ...categories].map((name) => (
          <button
            key={name ?? '__all'}
            onClick={() => onPick(name)}
            aria-pressed={value === name}
            className={cn(
              'min-h-14 rounded-[10px] border px-3 py-2 text-left font-semibold',
              value === name ? 'border-brand bg-brand-tint text-brand-dark' : 'border-line bg-surface'
            )}
          >
            {name ?? tc('all')}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
