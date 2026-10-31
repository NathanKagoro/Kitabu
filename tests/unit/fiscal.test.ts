import { describe, expect, it } from 'vitest';

import {
  fiscalTotals,
  nextCounters,
  rctXml,
  receiptVerificationNumber,
  TRA_TAX_CODE,
  traPaymentType,
  traVerifyUrl,
  vatOf,
} from '@/lib/fiscal/tra';

describe('TRA receipt format', () => {
  it('takes VAT out of VAT-inclusive prices', () => {
    expect(vatOf(11800, 18)).toBe(1800);
    expect(vatOf(5000, 0)).toBe(0);
  });

  it('groups totals by tax code, standard VAT only on standard-rated lines', () => {
    const totals = fiscalTotals({
      vatRate: 18,
      discount: 0,
      lines: [
        { id: 'a', description: 'Cement', qty: 1, amountInclusive: 11800, vatType: 'standard' },
        { id: 'b', description: 'Maize flour', qty: 2, amountInclusive: 4000, vatType: 'exempt' },
      ],
    });
    expect(totals.inclusive).toBe(15800);
    expect(totals.vat).toEqual([
      { taxCode: 1, rate: 18, net: 10000, tax: 1800 },
      { taxCode: 5, rate: 0, net: 4000, tax: 0 },
    ]);
    expect(totals.exclusive).toBe(14000);
  });

  it('maps payment methods and tax types to TRA codes', () => {
    expect(traPaymentType('cash')).toBe('CASH');
    expect(traPaymentType('mpesa')).toBe('EMONEY');
    expect(traPaymentType('airtel')).toBe('EMONEY');
    expect(traPaymentType('credit')).toBe('INVOICE');
    expect(TRA_TAX_CODE).toEqual({ standard: 1, zero: 3, exempt: 5 });
  });

  it('the global counter never resets; the daily one restarts each day', () => {
    const first = nextCounters(null, '2026-10-31');
    expect(first).toEqual({ gc: 1, dc: 1, znum: '20261031' });
    const second = nextCounters(first, '2026-10-31');
    expect(second).toEqual({ gc: 2, dc: 2, znum: '20261031' });
    expect(nextCounters(second, '2026-11-01')).toEqual({ gc: 3, dc: 1, znum: '20261101' });
  });

  it('builds the verification number and link', () => {
    expect(receiptVerificationNumber('A1B2C3', 57)).toBe('A1B2C357');
    expect(traVerifyUrl('A1B2C357')).toBe('https://virtual.tra.go.tz/efdmsRctVerify/A1B2C357');
  });

  it('writes the RCT message with counters, items, totals and escaped text', () => {
    const body = rctXml({
      tin: '123456789',
      regId: 'TZ0100',
      efdSerial: '10TZ100',
      receiptCode: 'A1B2C3',
      issuedAt: new Date(2026, 9, 31, 14, 5, 9),
      counters: { gc: 57, dc: 4, znum: '20261031' },
      lines: [{ id: 'l1', description: 'Rangi & brashi', qty: 1, amountInclusive: 11800, vatType: 'standard' }],
      discount: 0,
      payments: [{ method: 'mpesa', amount: 11800 }],
      customer: { name: 'Baraka', tin: null, phone: '0712000000' },
      vatRate: 18,
    });
    expect(body).toContain('<DATE>2026-10-31</DATE><TIME>14:05:09</TIME>');
    expect(body).toContain('<DC>4</DC><GC>57</GC><ZNUM>20261031</ZNUM>');
    expect(body).toContain('<RCTVNUM>A1B2C357</RCTVNUM>');
    expect(body).toContain('<DESC>Rangi &amp; brashi</DESC>');
    expect(body).toContain('<TOTALTAXEXCL>10000.00</TOTALTAXEXCL><TOTALTAXINCL>11800.00</TOTALTAXINCL>');
    expect(body).toContain('<PMTTYPE>EMONEY</PMTTYPE><PMTAMOUNT>11800.00</PMTAMOUNT>');
    expect(body).toContain('<CUSTIDTYPE>6</CUSTIDTYPE>');
  });
});
