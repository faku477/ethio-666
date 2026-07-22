import Link from "next/link";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";

export function SiteHeader({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={localePath(locale, "/")}
          className="flex items-center gap-3 rounded-md"
        >
          <Logo />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-ink sm:text-lg">
              {dict.site.name}
            </span>
            <span className="hidden text-xs text-muted sm:block">
              {dict.site.tagline}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href={localePath(locale, "/status")}
            className="hidden text-sm font-medium text-brand-700 underline-offset-2 transition-colors hover:text-brand-800 hover:underline sm:inline-block"
          >
            {dict.nav.status}
          </Link>
          <Link
            href={localePath(locale, "/register")}
            className="hidden rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 sm:inline-block"
          >
            {dict.nav.register}
          </Link>
          <LanguageSwitcher locale={locale} label={dict.nav.switchLanguage} />
        </div>
      </div>

      {/* Mobile navigation.
          The organization name runs to two lines on a phone, so these two links
          cannot share the top row with it — they get their own full-width row
          instead of being hidden, which is what left /status unreachable on
          mobile entirely. */}
      <nav className="flex items-center gap-2 border-t border-line px-4 py-2 sm:hidden">
        <Link
          href={localePath(locale, "/register")}
          className="flex-1 rounded-lg bg-brand-700 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          {dict.nav.register}
        </Link>
        <Link
          href={localePath(locale, "/status")}
          className="flex-1 rounded-lg border border-line px-3 py-2 text-center text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300"
        >
          {dict.nav.status}
        </Link>
      </nav>
    </header>
  );
}
