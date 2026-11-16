'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Logo } from '@/components/brand/logo';
import { HOME, IS_DAFTARI } from '@/lib/edition';
import { getMeta, META_KEYS } from '@/lib/local/db';

/**
 * The front door. A phone that is signed in goes home (Kitabu's dashboard,
 * Daftari's Leo). In Kitabu, a phone that has never signed in is a visitor
 * following the site's link, so it gets the sample hardware shop's dashboard
 * rather than a sign-in form; shops sign in with the link their setup code
 * comes with. Daftari's visitors are shop owners, so they go to sign-in.
 */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    void (async () => {
      const signedIn = Boolean(await getMeta<string | null>(META_KEYS.userId, null).catch(() => null));
      router.replace(signedIn || IS_DAFTARI ? HOME : '/demo');
    })();
  }, [router]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper">
      <Logo size={64} />
    </div>
  );
}
