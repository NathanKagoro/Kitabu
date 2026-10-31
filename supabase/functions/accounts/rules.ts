/**
 * The decisions the `accounts` function makes, kept free of Deno and Supabase
 * so they can be unit-tested (tests/unit/accounts-rules.test.ts).
 */

export type Role = 'owner' | 'manager' | 'cashier';
export type Mode = 'genge' | 'duka' | 'biashara';

/** Mirrors lib/modes.ts MODE_FOR_TYPE. */
export const MODE_FOR_TYPE: Record<string, Mode> = {
  cosmetics: 'duka',
  clothes: 'duka',
  genge: 'genge',
  duka: 'duka',
  pharmacy: 'duka',
  hardware: 'biashara',
  wholesale: 'biashara',
  services: 'biashara',
  other: 'duka',
};

export function modeForType(type: string): Mode | null {
  return MODE_FOR_TYPE[type] ?? null;
}

export interface Caller {
  userId: string;
  isOperator: boolean;
  /** The caller's role in the business concerned, if they are a member of it. */
  roleThere: Role | null;
}

export interface Target {
  userId: string | null;
  role: Role;
  active: boolean;
}

/**
 * Who may give a member a (new) setup code:
 *   - the operator, for anyone;
 *   - an owner, for their own managers and cashiers -- not for another owner,
 *     and not for themselves (a forgotten owner password goes to the operator,
 *     who can check it is really them).
 */
export function mayIssueCode(caller: Caller, target: Target): boolean {
  if (!target.active) return false;
  if (caller.isOperator) return true;
  if (caller.roleThere !== 'owner') return false;
  if (target.role === 'owner') return false;
  if (target.userId && target.userId === caller.userId) return false;
  return true;
}

const HEX = /^#[0-9a-f]{6}$/i;

export interface ShopInput {
  name: string;
  type: string;
  ownerName: string | null;
  ownerPhone: string;
  locale: 'sw' | 'en';
  brandColor: string | null;
  /** Which product the shop uses: Kitabu (default) or Daftari. */
  edition: 'kitabu' | 'daftari';
}

/** Validates the operator's "new shop" form. Returns an error key or the clean input. */
export function parseShopInput(raw: Record<string, unknown>): ShopInput | { error: string } {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const type = typeof raw.type === 'string' ? raw.type : '';
  const ownerPhone = typeof raw.ownerPhone === 'string' ? raw.ownerPhone : '';
  const ownerName = typeof raw.ownerName === 'string' && raw.ownerName.trim() ? raw.ownerName.trim() : null;
  const locale = raw.locale === 'en' ? 'en' : 'sw';
  const brandColor = typeof raw.brandColor === 'string' && HEX.test(raw.brandColor) ? raw.brandColor : null;
  const edition = raw.edition === 'daftari' ? 'daftari' : 'kitabu';
  if (name.length < 2 || name.length > 80) return { error: 'badName' };
  if (!modeForType(type)) return { error: 'badType' };
  if (!ownerPhone) return { error: 'badPhone' };
  return { name, type, ownerName, ownerPhone, locale, brandColor, edition };
}

/** The settings keys the operator may set from the admin screen. */
export function cleanSettingsPatch(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const patch = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof patch.brandColor === 'string' && HEX.test(patch.brandColor)) out.brandColor = patch.brandColor;
  if (typeof patch.plan === 'string' && (PLANS as readonly string[]).includes(patch.plan)) out.plan = patch.plan;
  if (patch.logoUrl === null) out.logoUrl = null;
  else if (typeof patch.logoUrl === 'string' && isAcceptableLogo(patch.logoUrl)) out.logoUrl = patch.logoUrl;
  return out;
}

/**
 * The shop's logo, set by the operator. A small image stored inline (the admin
 * screen shrinks it to 256px first) so it works offline and on receipts with
 * no storage bucket, or an https link. Capped so settings stay light to sync.
 */
export const MAX_LOGO_CHARS = 60_000;
const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

export function isAcceptableLogo(value: string): boolean {
  if (value.length > MAX_LOGO_CHARS) return false;
  if (LOGO_DATA_URL.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && value.length <= 500;
  } catch {
    return false;
  }
}

// --- The operator's console ------------------------------------------------

export interface MemberRow {
  id: string;
  business_id: string;
  user_id: string | null;
  name: string | null;
  phone: string | null;
  role: Role;
  active: boolean;
}

export interface ActivityRow {
  business_id: string;
  last_seen_at: string | null;
  last_sale_at: string | null;
  sales_30_days: number | string | null;
}

export interface ShopRow {
  id: string;
  name: string;
  type: string;
  status: string;
  settings: Record<string, unknown> | null;
  created_at: string;
}

export const PLANS = ['trial', 'standard', 'managed'] as const;
export type Plan = (typeof PLANS)[number];

const ROLE_ORDER: Record<Role, number> = { owner: 0, manager: 1, cashier: 2 };

/**
 * One shop as the console shows it: who has access (everyone active, owner
 * first), how it looks, its plan, and when it was last used.
 */
export function summariseShop(shop: ShopRow, members: readonly MemberRow[], activity: ActivityRow | undefined) {
  const people = members
    .filter((m) => m.business_id === shop.id && m.active)
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || (a.name ?? '').localeCompare(b.name ?? ''))
    .map((m) => ({ memberId: m.id, name: m.name, phone: m.phone, role: m.role, hasLogin: Boolean(m.user_id) }));
  const owner = people.find((p) => p.role === 'owner') ?? null;
  const settings = shop.settings ?? {};
  const plan = PLANS.includes(settings.plan as Plan) ? (settings.plan as Plan) : null;
  return {
    id: shop.id,
    name: shop.name,
    type: shop.type,
    status: shop.status,
    brandColor: (settings.brandColor as string | undefined) ?? null,
    logoUrl: (settings.logoUrl as string | undefined) ?? null,
    plan,
    edition: settings.edition === 'daftari' ? ('daftari' as const) : ('kitabu' as const),
    createdAt: shop.created_at,
    owner: owner ? { memberId: owner.memberId, name: owner.name, phone: owner.phone, hasLogin: owner.hasLogin } : null,
    staff: people.length - (owner ? 1 : 0),
    people,
    lastSeenAt: activity?.last_seen_at ?? null,
    lastSaleAt: activity?.last_sale_at ?? null,
    sales30: Number(activity?.sales_30_days ?? 0),
  };
}
