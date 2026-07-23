import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RegistrationStatusPanel } from "@/components/RegistrationStatusPanel";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { getPaymentSettings } from "@/lib/payment-settings";
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

  // Narrow select: `bankAccountNumber` and `identificationId` are not listed,
  // so they cannot reach this page even by accident.
  const [registration, settings] = await Promise.all([
    prisma.registration.findUnique({
      where: { registrationId },
      select: {
        registrationId: true,
        certificateNumber: true,
        fullName: true,
        createdAt: true,
        status: true,
        rejectionReason: true,
        payment: {
          select: {
            status: true,
            referenceNumber: true,
            receiptUrl: true,
            submittedAt: true,
          },
        },
      },
    }),
    getPaymentSettings(),
  ]);

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

        <p className="mt-4 text-base text-ink">{dict.success.intro}</p>
        {/* Payment proof was submitted with the registration, so this now says
            it is under review rather than asking the participant to pay next. */}
        <p className="mt-2 text-sm text-muted">
          {dict.payment.submittedBody}
        </p>

        <dl className="mt-6 divide-y divide-line border-y border-line">
          <div className="flex flex-wrap justify-between gap-2 py-3">
            <dt className="text-sm text-muted">{dict.verify.name}</dt>
            <dd className="font-medium text-ink">{registration.fullName}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 py-3">
            <dt className="text-sm text-muted">
              {dict.success.certificateNumber}
            </dt>
            <dd className="font-mono font-semibold text-brand-800">
              {registration.certificateNumber}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-muted">{dict.success.keepNumber}</p>
      </div>

      <div className="mt-8">
        <RegistrationStatusPanel
          registration={{
            ...registration,
            payment: registration.payment
              ? {
                  status: registration.payment.status,
                  referenceNumber: registration.payment.referenceNumber,
                  // Only whether a receipt exists — never its storage URL.
                  hasReceipt: Boolean(registration.payment.receiptUrl),
                  submittedAt: registration.payment.submittedAt,
                }
              : null,
          }}
          settings={settings}
          dict={dict}
          locale={lang}
          allowPaymentSubmission={false}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href={localePath(lang, "/status")}
          className="text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          {dict.success.checkStatus}
        </Link>
        <Link
          href={localePath(lang, "/")}
          className="text-sm font-medium text-muted underline underline-offset-2 hover:text-ink"
        >
          {dict.common.backHome}
        </Link>
      </div>
    </div>
  );
}
