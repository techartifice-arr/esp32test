'use client';

import { ChangeEvent, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

export default function LocaleLoginPage() {
  const t = useTranslations('app');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push(`/${locale}/dashboard`);
  }

  async function handleSignUp() {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage('Check your inbox to confirm registration.');
  }

  return (
    <div className="page-container">
      <div className="header-row mb-8">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('app.language')}</p>
          <LanguageSwitcher />
        </div>
        <ThemeToggle />
      </div>

      <div className="card max-w-3xl mx-auto">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.25em] text-sky-600">{t('app.title')}</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('app.subtitle')}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
          <div>
            <div className="mb-5 rounded-[2rem] bg-slate-100 p-6 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('app.dashboard')}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('app.userManagement')}</p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                className={`button ${mode === 'login' ? '' : 'secondary'}`}
                onClick={() => setMode('login')}
              >
                {t('app.signIn')}
              </button>
              <button
                type="button"
                className={`button ${mode === 'register' ? '' : 'secondary'}`}
                onClick={() => setMode('register')}
              >
                {t('app.signUp')}
              </button>
            </div>
          </div>

          <div>
            <div className="space-y-5">
              <div>
                <label className="label" htmlFor="email">{t('app.email')}</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="label" htmlFor="password">{t('app.password')}</label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {message ? <p className="text-sm text-rose-500">{message}</p> : null}

              <button
                type="button"
                className="button w-full"
                onClick={mode === 'login' ? handleSignIn : handleSignUp}
                disabled={loading}
              >
                {loading ? t('app.loading') : mode === 'login' ? t('app.signIn') : t('app.signUp')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
