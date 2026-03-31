'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { supabase } from '@/lib/supabaseClient';
import type { Device, Profile } from '@/lib/types';

export default function AdminPage() {
  const t = useTranslations('app');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadAdmin() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.replace(`/${locale}`);
        return;
      }
      const userId = sessionData.session.user.id;
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!profileData) {
        setMessage('Admin profile not found.');
        setLoading(false);
        return;
      }
      setProfile(profileData);
      if (profileData.role !== 'admin') {
        setMessage('Unauthorized.');
        setLoading(false);
        return;
      }
      await loadUsers();
      await loadDevices();
      setLoading(false);
    }
    loadAdmin();
  }, [locale, router]);

  async function loadUsers() {
    const { data, error } = await supabase.from('profiles').select('*').order('role', { ascending: true });
    if (error) {
      setMessage(error.message);
      return;
    }
    setUsers(data ?? []);
  }

  async function loadDevices() {
    const { data, error } = await supabase.from('devices').select('*').order('created_at', { ascending: false });
    if (error) {
      setMessage(error.message);
      return;
    }
    setDevices(data ?? []);
  }

  async function handleCreateUser() {
    if (!form.email || !form.password) {
      setMessage('Email and password are required.');
      return;
    }
    setMessage('');
    const { data: signUpData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (authError) {
      setMessage(authError.message);
      return;
    }
    const newUserId = signUpData?.user?.id;
    if (newUserId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: newUserId, full_name: form.email, role: form.role, is_active: true }]);
      if (profileError) {
        setMessage(profileError.message);
        return;
      }
    } else {
      setMessage('User created, but profile was not created automatically.');
      return;
    }
    setForm({ email: '', password: '', role: 'user' });
    setMessage('New user created.');
    await loadUsers();
  }

  async function handleToggleRole(userId: string, currentRole: string) {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', userId);
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadUsers();
  }

  async function handleToggleDevice(deviceId: string, currentStatus: 'active' | 'inactive') {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('devices').update({ status: nextStatus }).eq('id', deviceId);
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadDevices();
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="card text-center">{t('app.loading')}</div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="card">
          <h2 className="text-xl font-semibold">Unauthorized</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="page-container">
        <div className="header-row mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-sky-600">{t('app.admin')}</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{t('app.userManagement')}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {message ? <div className="alert">{message}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="card">
            <h2 className="section-title">{t('app.userManagement')}</h2>
            <div className="mb-6 rounded-3xl bg-slate-50 p-5 dark:bg-slate-950">
              <div className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select
                    className="select"
                    value={form.role}
                    onChange={(event) => setForm({ ...form, role: event.target.value })}
                  >
                    <option value="user">{t('app.userRole')}</option>
                    <option value="admin">{t('app.adminRole')}</option>
                  </select>
                </div>
                <button className="button" type="button" onClick={handleCreateUser}>
                  {t('app.addUser')}
                </button>
              </div>
            </div>

            <div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Email / Name</th>
                    <th>{t('app.role')}</th>
                    <th>{t('app.status')}</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.full_name || user.id}</td>
                      <td>{user.role}</td>
                      <td>{user.is_active ? t('app.active') : t('app.inactive')}</td>
                      <td>
                        <button
                          className="button outline"
                          type="button"
                          onClick={() => handleToggleRole(user.id, user.role)}
                        >
                          {user.role === 'admin' ? t('app.userRole') : t('app.adminRole')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">{t('app.devices')}</h2>
            <div className="space-y-4">
              {devices.length ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('app.devices')}</th>
                      <th>{t('app.status')}</th>
                      <th>Owner</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr key={device.id}>
                        <td>{device.name}</td>
                        <td>{device.status}</td>
                        <td>{device.owner_id || '-'}</td>
                        <td>
                          <button
                            type="button"
                            className="button outline"
                            onClick={() => handleToggleDevice(device.id, device.status)}
                          >
                            {device.status === 'active' ? t('app.disable') : t('app.enable')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>{t('app.noData')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
