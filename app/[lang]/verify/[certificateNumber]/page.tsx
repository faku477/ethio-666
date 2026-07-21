import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDate, getDictionary, isLocale, localePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/verify/[certificateNumber]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.verify.title };
}

/**
 * Public certificate verification — the page a QR code scan lands on.
 *
 * Deliberately shows only the holder's name, the two public identifiers and the
 * issue date. Identification number, phone number, email and bank account are
 * all withheld: anyone in possession of a certificate can open this page.
 */
export default async function VerifyPage({
  params,
}: PageProps<"/[lang]/verify/[certificateNumber]">) {
  const { lang, certificateNumber } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  const registration = await prisma.registration.findUnique({
    where: { certificateNumber },
    select: {
      fullName: true,
      registrationId: true,
      certificateNumber: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-center text-2xl font-bold text-ink sm:text-3xl">
        {dict.verify.title}
      </h1>

      {registration ? (
        <div className="mt-8 rounded-2xl border border-brand-200 bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-center gap-3 rounded-xl bg-brand-50 px-4 py-3">
            <span className="text-2xl text-brand-700" aria-hidden="true">
              ✓
            </span>
            <span className="text-lg font-semibold text-brand-800">
              {dict.verify.valid}
            </span>
          </div>

          <dl className="mt-6 divide-y divide-line">
            <div className="flex flex-wrap justify-between gap-2 py-3">
              <dt className="text-sm text-muted">{dict.verify.name}</dt>
              <dd className="font-medium text-ink">{registration.fullName}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 py-3">
              <dt className="text-sm text-muted">
                {dict.verify.registrationId}
              </dt>
              <dd className="font-mono font-semibold text-brand-800">
                {registration.registrationId}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 py-3">
              <dt className="text-sm text-muted">
                {dict.verify.certificateNumber}
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
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:p-8">
          <span className="text-3xl text-red-600" aria-hidden="true">
            ✕
          </span>
          <p className="mt-3 text-lg font-semibold text-red-800">
            {dict.verify.notFound}
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href={localePath(lang, "/")}
          className="text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          {dict.common.backHome}
        </Link>
      </div>
    </div>
  );
}
