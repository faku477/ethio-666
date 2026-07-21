/**
 * Locale configuration.
 *
 * Amharic is the default locale and is served from unprefixed URLs (`/register`),
 * while every other locale is prefixed (`/en/register`). `proxy.ts` performs the
 * rewrite, so public URLs such as the certificate verification link stay stable
 * and locale-free.
 */

export const LOCALES = ["am", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "am";

/** Locales that carry a URL prefix. The default locale is served unprefixed. */
export const PREFIXED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Human-readable names, each written in its own language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  am: "አማርኛ",
  en: "English",
};

/** BCP 47 tags for `<html lang>` and `Intl` formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  am: "am-ET",
  en: "en-US",
};

/**
 * Builds a href for `path` in `locale`.
 *
 * `localePath("am", "/register")` -> "/register"
 * `localePath("en", "/register")` -> "/en/register"
 */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}
