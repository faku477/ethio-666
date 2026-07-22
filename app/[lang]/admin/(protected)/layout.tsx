import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { getAdmin } from "@/lib/auth";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";

/**
 * The guard for every administrative page.
 *
 * Grouped under `(protected)` so the login page — a sibling, outside the group
 * — is reachable without a session while everything else in `/admin` is not.
 *
 * This layout is a convenience *and* a real check, but it is not the only one:
 * each admin route handler re-verifies the session itself, because a layout
 * cannot protect an API endpoint.
 */
export default async function ProtectedAdminLayout({
  children,
  params,
}: LayoutProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const admin = await getAdmin();

  if (!admin) redirect(localePath(lang, "/admin/login"));

  return (
    <div className="min-h-full bg-canvas">
      <AdminNav locale={lang} dict={dict} adminName={admin.name} />

      {admin.mustChangePassword && (
        <div className="border-b border-amber-200 bg-amber-50">
          <p className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
            <span aria-hidden="true">⚠️</span>
            {dict.admin.mustChangePassword}
            <Link
              href={localePath(lang, "/admin/password")}
              className="font-semibold underline underline-offset-2"
            >
              {dict.admin.password.title}
            </Link>
          </p>
        </div>
      )}

      {children}
    </div>
  );
}
