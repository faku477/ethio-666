import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, isLocale } from "./lib/i18n/config";

/**
 * Locale resolution.
 *
 * Every page lives under `app/[lang]/`, but Amharic — the default locale — must
 * be reachable at unprefixed URLs, because certificate QR codes encode
 * `/verify/CERT-...` permanently and must never depend on a locale prefix.
 *
 *   /register      -> rewrite to /am/register   (URL in the address bar stays /register)
 *   /en/register   -> passthrough               (matches app/[lang] with lang=en)
 *   /am/register   -> redirect to /register     (collapse the duplicate)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/");
  const first = segments[1] ?? "";

  // `/am/...` is an internal path. Redirect so there is exactly one canonical
  // URL per page and search engines never index both.
  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = `/${segments.slice(2).join("/")}`;
    return NextResponse.redirect(url);
  }

  // A prefixed, supported locale such as `/en/...` already maps onto [lang].
  if (isLocale(first)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip API routes, ALL Next.js internals, and anything with a file extension.
  //
  // `_next` must be excluded in full, not just `_next/static` and `_next/image`:
  // the dev server's HMR endpoint (`/_next/webpack-hmr`) has no file extension,
  // so a narrower pattern rewrites it to `/am/_next/webpack-hmr`, it 404s, and
  // the HMR client reconnect-loops — reloading the page about once a second and
  // eating navigation clicks. `__nextjs*` covers the dev error-overlay routes.
  matcher: ["/((?!api|_next|__nextjs|favicon.ico|.*\\..*).*)"],
};
