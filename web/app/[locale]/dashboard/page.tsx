'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import AuthGuard from '@/components/AuthGuard';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { supabase } from '@/lib/supabaseClient';
import type { Device, Profile, Reading } from '@/lib/types';

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function DashboardPage() {
  const t = useTranslations('app');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const router = useRouter();
  const [userLoading, setUserLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');

  const currentDevice = devices.find((device) => device.id === selectedDeviceId);
  const latestReading = readings[0];
  const activeDevices = devices.filter((device) => device.status === 'active');

  const chartData = useMemo(
    () =>
      readings
        .slice(0, 20)
        .reverse()
        .map((reading) => ({
          time: new Date(reading.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temperature: reading.temperature,
          humidity: reading.humidity,
        })),
    [readings]
  );

  useEffect(() => {
    async function loadUser() {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        router.replace(`/${locale}`);
        return;
      }

      const userId = sessionData.session.user.id;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        setMessage(profileError.message);
      } else {
        setProfile(profileData);
      }

      await loadDevices(userId, profileData?.role === 'admin');
      await loadReadings(selectedDeviceId, startDate, endDate, profileData?.role === 'admin', userId);
      setUserLoading(false);
    }

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-readings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'readings' },
        (payload: { new: Reading }) => {
          setReadings((current) => [payload.new, ...current].slice(0, 500));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadDevices(userId: string, isAdmin?: boolean) {
    const query = supabase.from('devices').select('*').order('created_at', { ascending: false });
    if (!isAdmin) query.eq('owner_id', userId);
    const { data, error } = await query;
    if (error) {
      setMessage(error.message);
      return;
    }
    setDevices(data ?? []);
    if (data?.length) {
      setSelectedDeviceId((prev) => prev || data[0].id);
    }
  }

  async function loadReadings(
    deviceId: string,
    fromDate: string,
    toDate: string,
    isAdmin?: boolean,
    userId?: string
  ) {
    if (!deviceId) return;
    let query = supabase.from('readings').select('*').eq('device_id', deviceId).order('recorded_at', { ascending: false }).limit(500);
    if (fromDate) query = query.gte('recorded_at', new Date(fromDate).toISOString());
    if (toDate) query = query.lte('recorded_at', new Date(toDate).toISOString());
    const { data, error } = await query;
    if (error) {
      setMessage(error.message);
      return;
    }
    setReadings(data ?? []);
  }

  function downloadBlob(content: BlobPart, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    const csv = Papa.unparse(
      readings.map((item) => ({
        device_id: item.device_id,
        temperature: item.temperature,
        humidity: item.humidity,
        recorded_at: formatDate(item.recorded_at),
      }))
    );
    downloadBlob(csv, 'readings.csv', 'text/csv;charset=utf-8;');
  }

  function handleExportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(
      readings.map((item) => ({
        device_id: item.device_id,
        temperature: item.temperature,
        humidity: item.humidity,
        recorded_at: formatDate(item.recorded_at),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Readings');
    XLSX.writeFile(workbook, 'readings.xlsx');
  }

  function handleExportPDF() {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [[t('app.devices'), t('app.temperature'), t('app.humidity'), t('app.current')]],
      body: readings.map((item) => [item.device_id, item.temperature, item.humidity, formatDate(item.recorded_at)]),
    });
    doc.save('readings.pdf');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  }

  if (userLoading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="page-container">
        <div className="header-row mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-sky-600">{t('app.dashboard')}</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{t('app.title')}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <button className="button secondary" type="button" onClick={handleSignOut}>
              {t('app.logout')}
            </button>
          </div>
        </div>

        {message ? <div className="alert">{message}</div> : null}

        <div className="grid gap-6 lg:grid-cols-[1.5fr,0.9fr]">
          <div className="card">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('app.current')}</p>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{currentDevice?.name ?? t('app.noData')}</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{currentDevice?.location ?? ''}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="badge">{currentDevice?.status === 'active' ? t('app.active') : t('app.inactive')}</span>
                <span className="badge">{activeDevices.length} {t('app.devices')}</span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-6 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('app.temperature')}</p>
                <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-slate-100">{latestReading ? `${latestReading.temperature}°C` : t('app.noData')}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-6 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('app.humidity')}</p>
                <p className="mt-3 text-4xl font-semibold text-slate-900 dark:text-slate-100">{latestReading ? `${latestReading.humidity}%` : t('app.noData')}</p>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <label className="label" htmlFor="device">{t('app.devices')}</label>
                  <select
                    id="device"
                    className="select"
                    value={selectedDeviceId}
                    onChange={(event) => {
                      const deviceId = event.target.value;
                      setSelectedDeviceId(deviceId);
                      loadReadings(deviceId, startDate, endDate, profile?.role === 'admin', profile?.id);
                    }}
                  >
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div>
                    <label className="label" htmlFor="from">{t('app.from')}</label>
                    <input id="from" type="date" className="input" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor="to">{t('app.to')}</label>
                    <input id="to" type="date" className="input" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                  </div>
                  <button
                    type="button"
                    className="button"
                    onClick={() => loadReadings(selectedDeviceId, startDate, endDate, profile?.role === 'admin', profile?.id)}
                  >
                    {t('app.save')}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 h-80 rounded-[2rem] bg-slate-50 p-4 dark:bg-slate-950">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="temperature" fill="#2563eb" name={t('app.temperature')} />
                    <Bar dataKey="humidity" fill="#0f766e" name={t('app.humidity')} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">{t('app.noData')}</div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="button" onClick={handleExportCSV}>{t('app.csv')}</button>
              <button type="button" className="button" onClick={handleExportExcel}>{t('app.excel')}</button>
              <button type="button" className="button" onClick={handleExportPDF}>{t('app.pdf')}</button>
            </div>
          </div>

          <div className="card">
            <div className="mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('app.userManagement')}</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">{profile?.role === 'admin' ? t('app.admin') : t('app.userRole')}</h2>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl bg-slate-100 p-5 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('app.devices')}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{devices.length}</p>
              </div>
              <div className="rounded-3xl bg-slate-100 p-5 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('app.readings')}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{readings.length}</p>
              </div>
            </div>

            {latestReading && latestReading.temperature > 35 ? (
              <div className="alert">
                <strong>{t('app.highTemperature')}</strong>
                <p>{t('app.alertMessage')}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
