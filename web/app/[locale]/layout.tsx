import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { Providers } from '@/app/providers';

export const dynamicParams = false;
export const generateStaticParams = async () => [
  { locale: 'en' },
  { locale: 'my' },
  { locale: 'th' },
  { locale: 'zh' },
];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = (await import(`../../messages/${params.locale}.json`)).default;

  return (
    <html lang={params.locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
