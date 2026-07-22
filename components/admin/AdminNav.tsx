"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { localePath, type Dictionary, type Locale } from "@/lib/i18n";

/**
 * Admin bar: where you are, who you are, and the way out.
 *
 * A client component only because logging out is a POST — the links themselves
 * are ordinary navigations.
 */
export function AdminNav({
  locale,
  dict,
  adminName,
}: {
  locale: Locale;
  dict: Dictionary;
  adminName: string;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Even if the request fails, send the browser to the login page: the
      // session cookie is httpOnly and cannot be cleared here, but the
      // administrator must not be left sitting on a dashboard they asked to
      // leave. The server-side guard re-checks on the next request.
    }

    router.refresh();
    router.push(localePath(locale, "/admin/login"));
  }

  const links = [
    { href: "/admin", label: dict.admin.nav.dashboard },
    { href: "/admin/settings", label: dict.admin.nav.settings },
    { href: "/admin/password", label: dict.admin.nav.password },
  ];

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <nav className="flex flex-wrap items-center gap-1">
          <span className="mr-2 text-sm font-bold text-ink">
            {dict.admin.title}
          </span>
          {links.map((link) => (
            <Link
              key={link.href}
              href={localePath(locale, link.href)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-brand-50 hover:text-brand-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted sm:inline">
            {dict.admin.nav.signedInAs} <strong>{adminName}</strong>
          </span>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-60"
          >
            {dict.admin.nav.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
