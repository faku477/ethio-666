import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, isLocale } from "./lib/i18n/config";

/**
 * Kill switch: when true, every page and API route answers 404, as if the site
 * did not exist.
 *
 * Flip this back to `false` to bring the site up again — nothing else needs to
 * change, and no code is commented out. Note that this locks the administrator
 * out too; to keep the admin area reachable while the public site is down, add
 * a `pathname.startsWith("/admin")` exemption to the check below.
 *
 * Files with an extension (everything under `public/`) are outside the matcher
 * and keep being served; only routes go dark.
 */
const SITE_OFFLINE = true;

/**
 * A path no route matches, so Next renders its own 404 page with a 404 status.
 * Two segments on purpose: a single segment would land on `app/[lang]` and
 * depend on that layout's locale guard to reject it.
 */
const OFFLINE_TARGET = "/_site-offline/404";

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

  if (SITE_OFFLINE) {
    const url = request.nextUrl.clone();
    url.pathname = OFFLINE_TARGET;
    return NextResponse.rewrite(url);
  }

  // API routes carry no locale. They are matched only so the kill switch above
  // can reach them; while the site is up they pass through untouched.
  if (pathname.startsWith("/api")) return NextResponse.next();

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
  // Skip ALL Next.js internals and anything with a file extension. API routes
  // are matched — the kill switch has to cover them — and the proxy passes them
  // through itself while the site is up.
  //
  // `_next` must be excluded in full, not just `_next/static` and `_next/image`:
  // the dev server's HMR endpoint (`/_next/webpack-hmr`) has no file extension,
  // so a narrower pattern rewrites it to `/am/_next/webpack-hmr`, it 404s, and
  // the HMR client reconnect-loops — reloading the page about once a second and
  // eating navigation clicks. `__nextjs*` covers the dev error-overlay routes.
  matcher: ["/((?!_next|__nextjs|favicon.ico|.*\\..*).*)"],
};
