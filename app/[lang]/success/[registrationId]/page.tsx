import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDate, getDictionary, isLocale, localePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/success/[registrationId]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.success.title,
    // A registration confirmation is personal; keep it out of search results.
    robots: { index: false, follow: false },
  };
}

export default async function SuccessPage({
  params,
}: PageProps<"/[lang]/success/[registrationId]">) {
  const { lang, registrationId } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  // Narrow select: `bankAccountNumber` is not listed, so it cannot reach this
  // page even by accident.
  const registration = await prisma.registration.findUnique({
    where: { registrationId },
    select: {
      registrationId: true,
      certificateNumber: true,
      fullName: true,
      createdAt: true,
    },
  });

  if (!registration) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2xl border border-brand-200 bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-800">
            ✓
          </span>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">
            {dict.success.title}
          </h1>
        </div>

        <dl className="mt-8 divide-y divide-line border-y border-line">
          <div className="flex flex-wrap justify-between gap-2 py-3">
            <dt className="text-sm text-muted">{dict.verify.name}</dt>
            <dd className="font-medium text-ink">{registration.fullName}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 py-3">
            <dt className="text-sm text-muted">
              {dict.success.registrationId}
            </dt>
            <dd className="font-mono font-semibold text-brand-800">
              {registration.registrationId}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 py-3">
            <dt className="text-sm text-muted">
              {dict.success.certificateNumber}
            </dt>
            <dd className="font-mono font-semibold text-brand-800">
              {registration.certificateNumber}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 py-3">
            <dt className="text-sm text-muted">{dict.verify.issuedOn}</dt>
            <dd className="text-ink">
              {formatDate(registration.createdAt, lang)}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* A plain anchor, not <Link>: this is a file download served by a
              route handler, not a client-side navigation. `download` makes the
              browser save it rather than trying to render the PDF inline. */}
          <a
            href={`/api/certificate/${registration.registrationId}?lang=${lang}`}
            download
            className="rounded-xl bg-brand-700 px-6 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-brand-800"
          >
            {dict.success.download}
          </a>

          <Link
            href={localePath(lang, "/")}
            className="px-2 py-3 text-center text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
          >
            {dict.common.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
