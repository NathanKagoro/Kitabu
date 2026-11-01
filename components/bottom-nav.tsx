'use client';

import { BookUser, LayoutGrid, Menu, Package, ShoppingCart, Users, Wallet } from '@/components/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/cn';
import { IS_DAFTARI } from '@/lib/edition';

/**
 * Kitabu opens on the business dashboard; the till is the next tab. Stoo is
 * the stock room: products and quantities, and the jobs that change them
 * (buying, counting, losses), so it lights up on those screens too. The day's
 * close lives on the dashboard and in Zaidi.
 */
const KITABU_ITEMS: readonly NavItem[] = [
  { href: '/muhtasari', key: 'nav.home', Icon: LayoutGrid },
  { href: '/mauzo', key: 'nav.sales', Icon: Wallet },
  { href: '/bidhaa', key: 'nav.stock', Icon: Package, also: ['/stoo', '/manunuzi', '/hasara'] },
  { href: '/madeni', key: 'nav.credit', Icon: BookUser },
  { href: '/zaidi', key: 'nav.more', Icon: Menu },
];

interface NavItem {
  href: string;
  key: string;
  Icon: typeof Wallet;
  /** Other screens that belong to this tab. */
  also?: readonly string[];
}

/** Daftari opens on how the business is going; customers get a tab, money owed shows on Leo. */
const DAFTARI_ITEMS: readonly NavItem[] = [
  { href: '/leo', key: 'daftari.homeTab', Icon: LayoutGrid },
  { href: '/mauzo', key: 'nav.sales', Icon: Wallet },
  { href: '/manunuzi', key: 'nav.purchases', Icon: ShoppingCart },
  { href: '/wateja', key: 'clients.title', Icon: Users },
  { href: '/zaidi', key: 'nav.more', Icon: Menu },
];

const ITEMS = IS_DAFTARI ? DAFTARI_ITEMS : KITABU_ITEMS;

/**
 * Daftari: the black band again at the bottom, gold for the open tab.
 * Kitabu: a white bar with a navy rule over the open tab, like an office system.
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav
      aria-label={t('nav.more')}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom,0px)]',
        IS_DAFTARI ? 'border-band-line bg-band' : 'border-line bg-surface'
      )}
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map(({ href, key, Icon, also }) => {
          const active = [href, ...(also ?? [])].some((path) => pathname === path || pathname.startsWith(`${path}/`));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                // No prefetch: on a static host it pulls every tab's code into
                // the first load. The service worker already holds it, so a
                // tap is instant anyway, online or off.
                prefetch={false}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-[68px] flex-col items-center justify-center gap-1 px-0.5',
                  IS_DAFTARI ? (active ? 'text-accent' : 'text-band-soft') : active ? 'text-brand' : 'text-ink-faint'
                )}
              >
                {active ? (
                  <span aria-hidden className={cn('absolute inset-x-3 top-0 h-[3px] rounded-b', IS_DAFTARI ? 'bg-accent' : 'bg-brand')} />
                ) : null}
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span className={cn('leading-none', IS_DAFTARI ? 'font-label text-[13px]' : cn('text-[11.5px]', active ? 'font-bold' : 'font-medium'))}>
                  {t(key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
