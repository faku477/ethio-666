import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPasswordForm } from "@/components/admin/AdminPasswordForm";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/password">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.admin.password.title,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPasswordPage({
  params,
}: PageProps<"/[lang]/admin/password">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">
        {dict.admin.password.title}
      </h1>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <AdminPasswordForm dict={dict} />
      </div>
    </div>
  );
}
