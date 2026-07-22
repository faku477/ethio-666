import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdmin } from "@/lib/auth";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/login">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.admin.login.title,
    robots: { index: false, follow: false },
  };
}

export default async function AdminLoginPage({
  params,
}: PageProps<"/[lang]/admin/login">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  // Already signed in — there is nothing to log into.
  if (await getAdmin()) redirect(localePath(lang, "/admin"));

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">
          {dict.admin.login.title}
        </h1>
        <p className="mt-2 text-sm text-muted">{dict.admin.login.subtitle}</p>

        <div className="mt-8">
          <AdminLoginForm locale={lang} dict={dict} />
        </div>
      </div>
    </div>
  );
}
