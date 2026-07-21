"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  isLocale,
  localePath,
  LOCALES,
  LOCALE_NAMES,
  LOCALE_TAGS,
  type Locale,
} from "@/lib/i18n/config";

/**
 * Strips a locale prefix from the browser path so it can be re-prefixed for
 * another locale. Amharic paths are already unprefixed and pass through.
 */
function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (segments[1] && isLocale(segments[1])) {
    return `/${segments.slice(2).join("/")}`;
  }
  return pathname;
}

export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  // `usePathname` returns the URL in the address bar, not the rewritten
  // `/am/...` internal path, so this stays correct under the locale rewrite.
  const barePath = stripLocale(usePathname());

  return (
    <nav aria-label={label} className="flex items-center text-sm">
      {LOCALES.map((target, index) => {
        const isActive = target === locale;
        return (
          <span key={target} className="flex items-center">
            {index > 0 && (
              <span aria-hidden="true" className="px-2 text-line">
                |
              </span>
            )}
            <Link
              href={localePath(target, barePath)}
              hrefLang={LOCALE_TAGS[target]}
              aria-current={isActive ? "true" : undefined}
              className={
                isActive
                  ? "font-semibold text-brand-700"
                  : "text-muted transition-colors hover:text-brand-700"
              }
            >
              {LOCALE_NAMES[target]}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
