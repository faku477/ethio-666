import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RegistrationForm } from "@/components/RegistrationForm";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getPaymentSettings } from "@/lib/payment-settings";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/register">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = await getDictionary(lang);
  return { title: dict.register.title };
}

export default async function RegisterPage({
  params,
}: PageProps<"/[lang]/register">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const [dict, settings] = await Promise.all([
    getDictionary(lang),
    getPaymentSettings(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        {dict.register.title}
      </h1>
      <p className="mt-2 text-sm text-muted">{dict.register.subtitle}</p>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        {/* The dictionary is resolved on the server and handed to the client
            component as a prop, so no translation data ships for the locale
            the visitor is not using. */}
        <RegistrationForm locale={lang} dict={dict} settings={settings} />
      </div>
    </div>
  );
}
