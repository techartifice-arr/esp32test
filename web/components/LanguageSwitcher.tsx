'use client';

import { usePathname, useRouter } from 'next/navigation';

const locales = [
  { value: 'en', label: 'EN' },
  { value: 'my', label: 'မြန်' },
  { value: 'th', label: 'ไทย' },
  { value: 'zh', label: '中文' },
];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname?.split('/')[1] || 'en';
  const suffix = pathname?.startsWith(`/${currentLocale}`) ? pathname.slice(currentLocale.length + 1) : pathname;

  return (
    <select
      className="select"
      value={currentLocale}
      onChange={(event) => {
        const nextLocale = event.target.value;
        router.push(`/${nextLocale}${suffix}`);
      }}
    >
      {locales.map((locale) => (
        <option key={locale.value} value={locale.value}>
          {locale.label}
        </option>
      ))}
    </select>
  );
}
