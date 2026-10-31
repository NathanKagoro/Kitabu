'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { ShopLogo } from '@/components/brand/shop-logo';
import { ColourPicker } from '@/components/colour-picker';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { updateShop, type ShopPlan, type ShopSummary } from '@/lib/auth/accounts';
import { OptionGrid } from '@/components/ui/bits';
import { brandShades } from '@/lib/color';
import { shrinkLogo } from '@/lib/logo';
import { DEFAULT_BRAND } from '@/lib/shop-config';

/**
 * The operator sets how a shop looks: its colour and its logo. Both land in
 * the shop's settings and reach every phone on the next sync, and the receipt.
 * The preview shows the colour as the app will really use it in each mode
 * (lib/color.ts adjusts it until text on it is readable).
 */
export function ShopLookSheet({ shop, onClose, onSaved }: { shop: ShopSummary | null; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations('admin.look');
  const tac = useTranslations('accounts');
  const tcon = useTranslations('admin.console');
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  // The admin screen re-mounts this per shop (key={shop.id}), so state starts from the shop.
  const [colour, setColour] = useState(shop?.brandColor ?? DEFAULT_BRAND);
  const [logo, setLogo] = useState<string | null>(shop?.logoUrl ?? null);
  const [plan, setPlan] = useState<ShopPlan | null>(shop?.plan ?? null);
  const [saving, setSaving] = useState(false);

  const pick = async (picked: File | undefined) => {
    if (!picked) return;
    try {
      setLogo(await shrinkLogo(picked));
    } catch {
      toast(t('logoTooBig'), 'warn');
    }
  };

  const save = async () => {
    if (!shop) return;
    setSaving(true);
    const result = await updateShop(shop.id, { settings: { brandColor: colour, logoUrl: logo, ...(plan ? { plan } : {}) } });
    setSaving(false);
    if (!result.ok) return toast(tac(`errors.${result.error}`), 'warn');
    toast(t('saved'));
    onSaved();
    onClose();
  };

  const shades = brandShades(colour);

  return (
    <Sheet open={shop !== null} onClose={onClose} title={t('title', { shop: shop?.name ?? '' })}>
      <div className="space-y-5 p-4">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-ink-soft">{t('colour')}</p>
          <ColourPicker value={colour} onChange={setColour} label={t('colour')} />
        </div>

        <div className="grid grid-cols-2 gap-2" aria-label={t('preview')}>
          {(['light', 'dark'] as const).map((mode) => (
            <div
              key={mode}
              className="flex items-center gap-2 rounded-[10px] border border-line p-3"
              style={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1b1e1a' }}
            >
              <ShopLogo src={logo} size={28} />
              <span
                className="rounded-[8px] px-3 py-2 text-sm font-semibold"
                style={{ backgroundColor: shades[mode].brand, color: mode === 'light' ? '#ffffff' : '#10120f' }}
              >
                {t(mode)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">{t('logo')}</p>
          <div className="flex items-center gap-3">
            {logo ? <ShopLogo src={logo} size={56} /> : <span className="text-sm text-ink-faint">{t('noLogo')}</span>}
            <Button variant="secondary" size="sm" onClick={() => file.current?.click()}>
              {logo ? t('changeLogo') : t('addLogo')}
            </Button>
            {logo ? (
              <Button variant="ghost" size="sm" className="text-loss" onClick={() => setLogo(null)}>
                {t('removeLogo')}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-ink-faint">{t('logoHint')}</p>
          <input
            ref={file}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-ink-soft">{tcon('plan')}</p>
          <OptionGrid<ShopPlan>
            columns={3}
            value={plan ?? ('' as ShopPlan)}
            onChange={setPlan}
            options={(['trial', 'standard', 'managed'] as const).map((p) => ({ value: p, label: tcon(`plans.${p}`) }))}
          />
        </div>

        <Button size="lg" block disabled={saving} onClick={() => void save()}>
          {t('save')}
        </Button>
      </div>
    </Sheet>
  );
}
