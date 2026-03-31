import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ESP32 DHT11 Dashboard',
  description: 'Supabase-powered ESP32 dashboard with device management and realtime charts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
