'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Logo } from '@/components/brand/logo';
import { HOME } from '@/lib/edition';

/** The app has one home: the till in Kitabu, the day's summary in Daftari. */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(HOME);
  }, [router]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper">
      <Logo size={64} />
    </div>
  );
}
