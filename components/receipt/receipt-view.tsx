import { useTranslations } from 'next-intl';

import { Logo } from '@/components/brand/logo';
import { ShopLogo } from '@/components/brand/shop-logo';
import { brandShades } from '@/lib/color';
import { formatTZS } from '@/lib/money';
import { formatQty } from '@/lib/units';
import { brandColorOf } from '@/lib/shop-config';
import type { PaymentMethod } from '@/lib/types';

export interface ReceiptData {
  business: {
    name: string;
    phone?: string | null;
    tin?: string | null;
    footer?: string | null;
    address?: string | null;
    brandColor?: string | null;
    logoUrl?: string | null;
    tillNumbers?: Partial<Record<PaymentMethod, string>> | null;
  };
  sale: { total: number; discount: number; status: string; createdAt: string };
  lines: { description: string; qty: number; unitPrice: number; lineTotal: number }[];
  /** The TRA receipt, when the shop issues them. */
  fiscal?: {
    mode: 'demo' | 'live';
    status: 'pending' | 'issued' | 'failed';
    rctvNum: string | null;
    verifyUrl: string | null;
    gc: number | null;
    znum: string | null;
    vat: number;
    totalExclusive: number;
  } | null;
}

/** Rendered on the server for customers, and on the seller's phone offline. */
export function ReceiptView({ receipt }: { receipt: ReceiptData }) {
  const t = useTranslations('receipt');
  const tc = useTranslations('common');
  const tsales = useTranslations('sales');
  const tpay = useTranslations('payment');
  const tills = Object.entries(receipt.business.tillNumbers ?? {}).filter(
    (entry): entry is [PaymentMethod, string] => typeof entry[1] === 'string' && entry[1].trim() !== ''
  );
  const date = new Date(receipt.sale.createdAt).toLocaleString('sw-TZ', { timeZone: 'Africa/Dar_es_Salaam', dateStyle: 'medium', timeStyle: 'short' });

  return (
    <article className="card overflow-hidden">
      {/* The shop's own colour: a customer opening this link has no theme loaded. */}
      <header
        className="border-b border-line px-5 py-4 text-white"
        style={{ backgroundColor: brandShades(brandColorOf({ settings: { brandColor: receipt.business.brandColor ?? undefined } })).light.brand }}
      >
        <div className="flex items-center gap-3">
          <ShopLogo src={receipt.business.logoUrl} size={44} />
          <h1 className="text-xl font-bold">{receipt.business.name}</h1>
        </div>
        {receipt.business.address ? <p className="text-sm opacity-90">{receipt.business.address}</p> : null}
        {receipt.business.phone ? <p className="text-sm opacity-90">{receipt.business.phone}</p> : null}
        {receipt.business.tin ? <p className="text-sm opacity-90">TIN {receipt.business.tin}</p> : null}
      </header>
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-ink-soft">{t('header')}</p>
        <p className="text-sm text-ink-faint">{date}</p>
        {receipt.sale.status === 'void' ? (
          <p className="mt-3 rounded-[10px] bg-loss-tint px-3 py-2 font-semibold text-loss">{t('voidedNotice')}</p>
        ) : null}
        <ul className="mt-4 space-y-2">
          {receipt.lines.map((line, index) => (
            <li key={index} className="flex justify-between gap-3">
              <span>
                {line.description}
                <span className="text-ink-faint"> × {formatQty(line.qty)}</span>
              </span>
              <span className="tnum font-semibold">{formatTZS(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        {receipt.sale.discount > 0 ? (
          <p className="mt-3 flex justify-between text-sm text-ink-soft">
            <span>{tsales('discount')}</span>
            <span className="tnum">-{formatTZS(receipt.sale.discount)}</span>
          </p>
        ) : null}
        <p className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-bold">
          <span>{tc('total')}</span>
          <span className="tnum">TSh {formatTZS(receipt.sale.total)}</span>
        </p>
        {tills.length ? (
          <ul className="mt-5 space-y-1 rounded-[10px] bg-paper px-3 py-2.5 text-sm">
            {tills.map(([method, number]) => (
              <li key={method} className="flex justify-between gap-3">
                <span className="text-ink-soft">{tpay(`methods.${method}`)}</span>
                <span className="tnum font-semibold">{number}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {receipt.fiscal ? <FiscalBlock fiscal={receipt.fiscal} /> : null}
        <p className="mt-6 text-center text-sm text-ink-soft">{receipt.business.footer || t('thanks')}</p>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
          <Logo size={16} />
          Kitabu
        </p>
      </div>
    </article>
  );
}

/**
 * The TRA part of a receipt. A demo receipt says so plainly and carries no TRA
 * link, so it can never pass for a real one.
 */
function FiscalBlock({ fiscal }: { fiscal: NonNullable<ReceiptData['fiscal']> }) {
  const t = useTranslations('receipt.fiscal');
  const demo = fiscal.mode === 'demo';
  return (
    <section className="mt-5 rounded-[10px] border border-line px-3 py-2.5 text-sm">
      <p className="flex items-center justify-between gap-2 font-bold">
        {t('title')}
        {demo ? <span className="rounded-full bg-debt-tint px-2 py-0.5 text-xs font-bold text-debt">{t('demo')}</span> : null}
      </p>
      {fiscal.status === 'issued' ? (
        <dl className="mt-2 space-y-1">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">{t('verification')}</dt>
            <dd className="tnum font-semibold">{fiscal.rctvNum}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">{t('number')}</dt>
            <dd className="tnum">{fiscal.gc}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">{t('zNumber')}</dt>
            <dd className="tnum">{fiscal.znum}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">{t('beforeVat')}</dt>
            <dd className="tnum">{formatTZS(fiscal.totalExclusive)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-soft">{t('vat')}</dt>
            <dd className="tnum">{formatTZS(fiscal.vat)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-1 text-ink-soft">{fiscal.status === 'pending' ? t('pending') : t('failed')}</p>
      )}
      {fiscal.verifyUrl ? (
        <a href={fiscal.verifyUrl} className="mt-2 block font-semibold text-brand underline" rel="noopener">
          {t('verify')}
        </a>
      ) : null}
      {demo ? <p className="mt-2 text-xs text-ink-faint">{t('demoNote')}</p> : null}
    </section>
  );
}
