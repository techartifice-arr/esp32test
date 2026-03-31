import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { Providers } from '@/app/providers';

export const dynamic = 'force-dynamic';
export const dynamicParams = false;
export const generateStaticParams = async () => [
  { locale: 'en' },
  { locale: 'my' },
  { locale: 'th' },
  { locale: 'zh' },
];

const localeMessagesLoaders = {
  en: () => import('../../messages/en.json'),
  my: () => import('../../messages/my.json'),
  th: () => import('../../messages/th.json'),
  zh: () => import('../../messages/zh.json'),
} as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: keyof typeof localeMessagesLoaders };
}) {
  const localeMessages = await localeMessagesLoaders[params.locale]();
  const messages = localeMessages.default ?? localeMessages;

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
