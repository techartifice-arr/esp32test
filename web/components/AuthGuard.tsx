'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function verify() {
      const { data } = await supabase.auth.getSession();
      const locale = pathname?.split('/')[1] || 'en';
      if (!data.session) {
        router.replace(`/${locale}`);
      } else {
        setHasSession(true);
      }
      setIsLoading(false);
    }
    verify();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="card">
          <p className="text-center text-slate-700 dark:text-slate-200">Loading secure dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return null;
  }

  return <>{children}</>;
}
