import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentSettingsForm } from "@/components/admin/PaymentSettingsForm";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getPaymentSettings } from "@/lib/payment-settings";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/settings">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.admin.settings.title,
    robots: { index: false, follow: false },
  };
}

export default async function AdminSettingsPage({
  params,
}: PageProps<"/[lang]/admin/settings">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const settings = await getPaymentSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">
        {dict.admin.settings.title}
      </h1>
      <p className="mt-2 text-sm text-muted">{dict.admin.settings.intro}</p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <PaymentSettingsForm settings={settings} dict={dict} />
      </div>
    </div>
  );
}
