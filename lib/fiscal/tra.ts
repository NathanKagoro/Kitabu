/**
 * TRA VFD receipt format, as pure functions (tests/unit/fiscal.test.ts).
 *
 * Follows the VFD API's RCT message (tra-docs.netlify.app/guide/api, a
 * community copy of TRA's docs, last updated 2021): items, totals, VAT totals,
 * payments, a daily counter (DC) that resets each day, a global counter (GC)
 * that never resets, and a verification number RCTVNUM = RECEIPTCODE + GC.
 * Confirm field details with TRA or the chosen provider before going live:
 * they are marked below where the docs were unclear.
 */
import type { PaymentMethod, VatType } from '../types';

/**
 * TRA tax codes, A..E as 1..5 (A standard 18%, B special rate, C zero-rated,
 * D special relief, E exempt). TO CONFIRM: registration returns the codes a
 * taxpayer actually uses; this mapping is the common one.
 */
export const TRA_TAX_CODE: Record<VatType, 1 | 3 | 5> = { standard: 1, zero: 3, exempt: 5 };

/** TRA's PMTTYPE values. Mobile money is EMONEY; credit is INVOICE. */
export type TraPaymentType = 'CASH' | 'CHEQUE' | 'CCARD' | 'EMONEY' | 'INVOICE';

export function traPaymentType(method: PaymentMethod): TraPaymentType {
  switch (method) {
    case 'cash':
      return 'CASH';
    case 'credit':
      return 'INVOICE';
    case 'bank':
      // A bank transfer has no code of its own; CHEQUE is the nearest. TO CONFIRM.
      return 'CHEQUE';
    default:
      return 'EMONEY';
  }
}

export interface FiscalCounters {
  /** Global counter: never resets, never skips. */
  gc: number;
  /** Daily counter: resets each business day. */
  dc: number;
  /** The Z-report this receipt belongs to: the business day as YYYYMMDD. */
  znum: string;
}

export interface FiscalLineInput {
  id: string;
  description: string;
  qty: number;
  /** Line amount the customer paid, VAT included (TZS). */
  amountInclusive: number;
  vatType: VatType;
}

export interface FiscalSaleInput {
  tin: string;
  regId: string;
  efdSerial: string;
  receiptCode: string;
  issuedAt: Date;
  counters: FiscalCounters;
  lines: readonly FiscalLineInput[];
  discount: number;
  payments: readonly { method: PaymentMethod; amount: number }[];
  customer?: { name?: string | null; phone?: string | null; tin?: string | null } | null;
  /** Standard VAT rate in percent (18 in Tanzania today). */
  vatRate: number;
}

export interface VatTotal {
  taxCode: 1 | 3 | 5;
  rate: number;
  net: number;
  tax: number;
}

export interface FiscalTotals {
  inclusive: number;
  exclusive: number;
  discount: number;
  vat: VatTotal[];
}

/** VAT out of a VAT-inclusive amount, in whole shillings. */
export function vatOf(inclusive: number, rate: number): number {
  return rate > 0 ? Math.round((inclusive * rate) / (100 + rate)) : 0;
}

export function fiscalTotals(input: Pick<FiscalSaleInput, 'lines' | 'discount' | 'vatRate'>): FiscalTotals {
  const groups = new Map<number, VatTotal>();
  let inclusive = 0;
  for (const line of input.lines) {
    const taxCode = TRA_TAX_CODE[line.vatType];
    const rate = line.vatType === 'standard' ? input.vatRate : 0;
    const tax = vatOf(line.amountInclusive, rate);
    const group = groups.get(taxCode) ?? { taxCode, rate, net: 0, tax: 0 };
    group.net += line.amountInclusive - tax;
    group.tax += tax;
    groups.set(taxCode, group);
    inclusive += line.amountInclusive;
  }
  const vat = [...groups.values()].sort((a, b) => a.taxCode - b.taxCode);
  const exclusive = vat.reduce((sum, g) => sum + g.net, 0);
  return { inclusive, exclusive, discount: input.discount, vat };
}

/** RCTVNUM: the receipt code from registration followed by the global counter. */
export function receiptVerificationNumber(receiptCode: string, gc: number): string {
  return `${receiptCode}${gc}`;
}

/** Where a customer or a bank checks a live receipt. Demo receipts get none. */
export function traVerifyUrl(rctvnum: string): string {
  return `https://virtual.tra.go.tz/efdmsRctVerify/${encodeURIComponent(rctvnum)}`;
}

export function zNumber(businessDay: string): string {
  return businessDay.replace(/-/g, '');
}

const xml = (value: string | number) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The <RCT> section TRA expects, unsigned. A live connector signs this
 * (SHA1withRSA with the TRA-issued certificate) on the server, never on a
 * phone: the certificate can issue receipts in the business's name.
 */
export function rctXml(input: FiscalSaleInput): string {
  const totals = fiscalTotals(input);
  const d = input.issuedAt;
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const customer = input.customer ?? {};
  // CUSTIDTYPE 1 = TIN, 6 = none. TO CONFIRM the other codes (NIDA, passport...).
  const custIdType = customer.tin ? 1 : 6;

  const items = input.lines
    .map(
      (l) =>
        `<ITEM><ID>${xml(l.id)}</ID><DESC>${xml(l.description)}</DESC><QTY>${l.qty}</QTY>` +
        `<TAXCODE>${TRA_TAX_CODE[l.vatType]}</TAXCODE><AMT>${l.amountInclusive.toFixed(2)}</AMT></ITEM>`
    )
    .join('');
  const payments = input.payments
    .map((p) => `<PMTTYPE>${traPaymentType(p.method)}</PMTTYPE><PMTAMOUNT>${p.amount.toFixed(2)}</PMTAMOUNT>`)
    .join('');
  const vat = totals.vat
    .map((v) => `<VATRATE>${v.taxCode}</VATRATE><NETTAMOUNT>${v.net.toFixed(2)}</NETTAMOUNT><TAXAMOUNT>${v.tax.toFixed(2)}</TAXAMOUNT>`)
    .join('');

  return (
    `<RCT><DATE>${date}</DATE><TIME>${time}</TIME><TIN>${xml(input.tin)}</TIN><REGID>${xml(input.regId)}</REGID>` +
    `<EFDSERIAL>${xml(input.efdSerial)}</EFDSERIAL><CUSTIDTYPE>${custIdType}</CUSTIDTYPE><CUSTID>${xml(customer.tin ?? '')}</CUSTID>` +
    `<CUSTNAME>${xml(customer.name ?? '')}</CUSTNAME><MOBILENUM>${xml(customer.phone ?? '')}</MOBILENUM>` +
    `<RCTNUM>${input.counters.gc}</RCTNUM><DC>${input.counters.dc}</DC><GC>${input.counters.gc}</GC><ZNUM>${input.counters.znum}</ZNUM>` +
    `<RCTVNUM>${xml(receiptVerificationNumber(input.receiptCode, input.counters.gc))}</RCTVNUM>` +
    `<ITEMS>${items}</ITEMS>` +
    `<TOTALS><TOTALTAXEXCL>${totals.exclusive.toFixed(2)}</TOTALTAXEXCL><TOTALTAXINCL>${totals.inclusive.toFixed(2)}</TOTALTAXINCL>` +
    `<DISCOUNT>${totals.discount.toFixed(2)}</DISCOUNT></TOTALS>` +
    `<PAYMENTS>${payments}</PAYMENTS><VATTOTALS>${vat}</VATTOTALS></RCT>`
  );
}

/** Next counters: GC always +1; DC +1, or back to 1 on a new business day. */
export function nextCounters(previous: { gc: number; dc: number; znum: string } | null, businessDay: string): FiscalCounters {
  const znum = zNumber(businessDay);
  if (!previous) return { gc: 1, dc: 1, znum };
  return { gc: previous.gc + 1, dc: previous.znum === znum ? previous.dc + 1 : 1, znum };
}
