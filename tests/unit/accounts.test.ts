import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CODE_ALPHABET,
  formatSetupCode,
  isAcceptablePassword,
  loginEmail,
  makeSetupCode,
  normaliseSetupCode,
  phoneDigits,
} from '@/lib/auth/login';
import { MODE_FOR_TYPE as APP_MODES } from '@/lib/modes';
import { cleanSettingsPatch, mayIssueCode, MODE_FOR_TYPE, parseShopInput, summariseShop } from '@/supabase/functions/accounts/rules';
import { daysSince } from '@/components/admin/console-parts';

describe('phone number -> login', () => {
  it('every way of writing a number is the same login', () => {
    for (const written of ['0712 345 678', '+255 712 345 678', '255712345678', '712345678', '0712-345-678']) {
      expect(loginEmail(written)).toBe('255712345678@phone.kitabu.app');
    }
  });

  it('refuses numbers that are not Tanzanian mobiles', () => {
    expect(phoneDigits('0212345678')).toBeNull();
    expect(phoneDigits('071234567')).toBeNull();
    expect(loginEmail('')).toBeNull();
  });
});

describe('setup codes', () => {
  const random = (seed: number) => {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (seed * 31 + i * 97) % 256;
    return bytes;
  };

  it('are 8 characters from the unambiguous alphabet', () => {
    for (let seed = 0; seed < 200; seed++) {
      const code = makeSetupCode(random(seed));
      expect(code).toHaveLength(8);
      for (const ch of code) expect(CODE_ALPHABET).toContain(ch);
    }
  });

  it('never contain characters that are easy to misread', () => {
    for (const ch of '0O1IL5S') expect(CODE_ALPHABET).not.toContain(ch);
  });

  it('skip bytes that would bias the alphabet', () => {
    const bytes = new Uint8Array(32).fill(250); // all above the cut-off
    bytes.set([0, 1, 2, 3, 4, 5, 6, 7], 20);
    expect(makeSetupCode(bytes)).toBe('ABCDEFGH');
    expect(() => makeSetupCode(new Uint8Array(32).fill(255))).toThrow();
  });

  it('are accepted however they are typed', () => {
    expect(normaliseSetupCode('abcd-efgh')).toBe('ABCDEFGH');
    expect(normaliseSetupCode(' ABCD EFGH ')).toBe('ABCDEFGH');
    expect(normaliseSetupCode('ABCD-EFG')).toBeNull();
    expect(normaliseSetupCode('ABCD-EFG0')).toBeNull();
    expect(formatSetupCode('ABCDEFGH')).toBe('ABCD-EFGH');
  });

  it('a chosen password must be at least 6 characters', () => {
    expect(isAcceptablePassword('12345')).toBe(false);
    expect(isAcceptablePassword('      ')).toBe(false);
    expect(isAcceptablePassword('mama2026')).toBe(true);
  });
});

describe('who may issue a setup code', () => {
  const owner = { userId: 'o', isOperator: false, roleThere: 'owner' as const };
  const cashierCaller = { userId: 'c', isOperator: false, roleThere: 'cashier' as const };
  const operator = { userId: 'x', isOperator: true, roleThere: null };

  it('the operator, for anyone', () => {
    expect(mayIssueCode(operator, { userId: 'o', role: 'owner', active: true })).toBe(true);
  });

  it('an owner, for their own staff only', () => {
    expect(mayIssueCode(owner, { userId: null, role: 'cashier', active: true })).toBe(true);
    expect(mayIssueCode(owner, { userId: 'm', role: 'manager', active: true })).toBe(true);
    expect(mayIssueCode(owner, { userId: 'o2', role: 'owner', active: true })).toBe(false);
    expect(mayIssueCode({ ...owner, roleThere: null }, { userId: null, role: 'cashier', active: true })).toBe(false);
  });

  it('not staff, not for removed people, not for yourself', () => {
    expect(mayIssueCode(cashierCaller, { userId: null, role: 'cashier', active: true })).toBe(false);
    expect(mayIssueCode(owner, { userId: null, role: 'cashier', active: false })).toBe(false);
    expect(mayIssueCode({ ...owner, roleThere: 'owner' }, { userId: 'o', role: 'manager', active: true })).toBe(false);
  });
});

describe('the operator’s new-shop form', () => {
  it('accepts a complete form and cleans it', () => {
    expect(parseShopInput({ name: '  Neema Cosmetics ', type: 'cosmetics', ownerPhone: '0712345678', brandColor: '#b0225f' })).toEqual({
      name: 'Neema Cosmetics',
      type: 'cosmetics',
      ownerName: null,
      ownerPhone: '0712345678',
      locale: 'sw',
      brandColor: '#b0225f',
      edition: 'kitabu',
    });
  });

  it('refuses a missing name, an unknown type or no phone', () => {
    expect(parseShopInput({ name: 'x', type: 'cosmetics', ownerPhone: '0712345678' })).toEqual({ error: 'badName' });
    expect(parseShopInput({ name: 'Duka', type: 'bakery', ownerPhone: '0712345678' })).toEqual({ error: 'badType' });
    expect(parseShopInput({ name: 'Duka', type: 'duka' })).toEqual({ error: 'badPhone' });
  });

  it('only lets a real colour through to settings', () => {
    expect(cleanSettingsPatch({ brandColor: '#123abc', vatRate: 0 })).toEqual({ brandColor: '#123abc' });
    expect(cleanSettingsPatch({ brandColor: 'red' })).toEqual({});
  });

  it('accepts a small inline logo or an https link, and removing it; refuses anything else', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(cleanSettingsPatch({ logoUrl: png })).toEqual({ logoUrl: png });
    expect(cleanSettingsPatch({ logoUrl: 'https://example.com/logo.png' })).toEqual({ logoUrl: 'https://example.com/logo.png' });
    expect(cleanSettingsPatch({ logoUrl: null })).toEqual({ logoUrl: null });
    expect(cleanSettingsPatch({ logoUrl: 'http://example.com/logo.png' })).toEqual({});
    expect(cleanSettingsPatch({ logoUrl: 'data:image/svg+xml;base64,PHN2Zz4=' })).toEqual({});
    expect(cleanSettingsPatch({ logoUrl: `data:image/png;base64,${'A'.repeat(70_000)}` })).toEqual({});
  });
});

describe('the function and the app agree', () => {
  it('on shop type -> mode', () => {
    expect(MODE_FOR_TYPE).toEqual(APP_MODES);
  });

  it('on login rules: the shared copy is identical to lib/auth/login.ts', () => {
    const app = readFileSync(join(process.cwd(), 'lib/auth/login.ts'), 'utf8');
    const fn = readFileSync(join(process.cwd(), 'supabase/functions/_shared/login.ts'), 'utf8');
    expect(fn).toBe(app);
  });
});

describe("the operator's console", () => {
  const shop = { id: 's1', name: 'Baraka Hardware', type: 'hardware', status: 'active', settings: { plan: 'standard', brandColor: '#123abc' }, created_at: '2026-10-01T00:00:00Z' };
  const member = (id: string, role: 'owner' | 'manager' | 'cashier', userId: string | null, active = true, business = 's1') => ({
    id, business_id: business, user_id: userId, name: id, phone: null, role, active,
  });

  it('lists everyone with access, owner first, and who can sign in', () => {
    const summary = summariseShop(
      shop,
      [member('Neema', 'cashier', null), member('Baraka', 'owner', 'u1'), member('Juma', 'manager', 'u2'), member('Gone', 'cashier', null, false), member('Other', 'owner', 'u9', true, 's2')],
      { business_id: 's1', last_seen_at: '2026-10-30T10:00:00Z', last_sale_at: '2026-10-30T09:00:00Z', sales_30_days: '42' }
    );
    expect(summary.people.map((p) => [p.name, p.role, p.hasLogin])).toEqual([
      ['Baraka', 'owner', true],
      ['Juma', 'manager', true],
      ['Neema', 'cashier', false],
    ]);
    expect(summary.staff).toBe(2);
    expect(summary.plan).toBe('standard');
    expect(summary.sales30).toBe(42);
    expect(summary.edition).toBe('kitabu');
    expect(summary.lastSeenAt).toBe('2026-10-30T10:00:00Z');
  });

  it('a shop with no activity yet, or an unknown plan, shows as such', () => {
    const summary = summariseShop({ ...shop, settings: { plan: 'gold' } }, [], undefined);
    expect(summary.plan).toBeNull();
    expect(summary.lastSeenAt).toBeNull();
    expect(summary.sales30).toBe(0);
    expect(summary.owner).toBeNull();
  });

  it('the operator can set a plan, but only a known one', () => {
    expect(cleanSettingsPatch({ plan: 'managed' })).toEqual({ plan: 'managed' });
    expect(cleanSettingsPatch({ plan: 'gold' })).toEqual({});
  });

  it('counts days by the calendar in Dar es Salaam', () => {
    const now = new Date('2026-10-31T08:00:00Z'); // 11:00 in Dar
    expect(daysSince(null, now)).toBeNull();
    expect(daysSince('2026-10-31T00:30:00Z', now)).toBe(0);
    expect(daysSince('2026-10-30T20:59:00Z', now)).toBe(1); // 23:59 the day before, in Dar
    expect(daysSince('2026-10-24T08:00:00Z', now)).toBe(7);
  });
});

describe('two products, one console', () => {
  const base = { name: 'Mama Asha', type: 'duka', ownerPhone: '0712345678' };
  it('a new shop is Kitabu unless the operator picks Daftari', () => {
    expect(parseShopInput(base)).toMatchObject({ edition: 'kitabu' });
    expect(parseShopInput({ ...base, edition: 'daftari' })).toMatchObject({ edition: 'daftari' });
    expect(parseShopInput({ ...base, edition: 'maktaba' })).toMatchObject({ edition: 'kitabu' });
  });

  it('the console says which product each shop uses', () => {
    const shop = { id: 's', name: 'Mama Asha', type: 'duka', status: 'active', settings: { edition: 'daftari' }, created_at: '2026-10-31T00:00:00Z' };
    expect(summariseShop(shop, [], undefined).edition).toBe('daftari');
  });
});
