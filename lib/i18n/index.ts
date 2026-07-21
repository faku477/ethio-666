import { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from "./config";
import type { Dictionary } from "./types";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  am: () => import("./dictionaries/am").then((m) => m.am),
  en: () => import("./dictionaries/en").then((m) => m.en),
};

/**
 * Loads the dictionary for `locale`. Dictionaries are imported dynamically so a
 * page only ever ships the strings for the locale it rendered.
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return (loaders[locale] ?? loaders[DEFAULT_LOCALE])();
}

/**
 * Formats a date for display.
 *
 * The Gregorian calendar is pinned explicitly: `Intl` resolves `am-ET` to the
 * Ethiopic calendar by default, which would silently print 2018 instead of 2026
 * and make certificate dates disagree with the stored timestamp.
 */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(`${LOCALE_TAGS[locale]}-u-ca-gregory`, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export * from "./config";
export type { Dictionary } from "./types";
