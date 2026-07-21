import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/register">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = await getDictionary(lang);
  return { title: dict.register.title };
}

/**
 * Registration page shell. The form itself (validation, photo upload, submit)
 * arrives in Phase 4 and mounts inside this card — the route, metadata and
 * layout exist now so the homepage CTA resolves to a real page.
 */
export default async function RegisterPage({
  params,
}: PageProps<"/[lang]/register">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        {dict.register.title}
      </h1>
      <p className="mt-2 text-sm text-muted">{dict.register.subtitle}</p>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-sm text-muted">{dict.register.preparing}</p>
      </div>
    </div>
  );
}
