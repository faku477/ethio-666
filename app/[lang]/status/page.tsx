import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RegistrationStatusPanel } from "@/components/RegistrationStatusPanel";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { getPaymentSettings } from "@/lib/payment-settings";
import { prisma } from "@/lib/prisma";
import { identificationLookupSchema } from "@/lib/validation";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/status">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.lookup.title,
    // Results are personal, and the query string carries an ID number.
    robots: { index: false, follow: false },
  };
}

/**
 * Registration lookup by identification number.
 *
 * A plain GET form: no client JavaScript, the result is server-rendered, and
 * the query is bookmarkable. The identification number is what the registrant
 * already knows by heart — unlike the registration number, which they may have
 * lost with the confirmation page.
 *
 * The page deliberately shows the same panel a registrant sees on their success
 * page, and no more: no phone number, email, bank account or identification
 * number is echoed back, so submitting a guessed ID number reveals nothing
 * beyond a name and a status.
 */
export default async function StatusPage({
  params,
  searchParams,
}: PageProps<"/[lang]/status">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  const query = await searchParams;
  const rawId = typeof query.id === "string" ? query.id : "";
  const submitted = rawId.trim().length > 0;
  const parsed = identificationLookupSchema.safeParse(rawId);

  const registration =
    submitted && parsed.success
      ? await prisma.registration.findUnique({
          where: { identificationId: parsed.data },
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
        })
      : null;

  const settings = registration ? await getPaymentSettings() : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        {dict.lookup.title}
      </h1>
      <p className="mt-2 text-sm text-muted">{dict.lookup.intro}</p>

      <form
        method="get"
        className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6"
      >
        <label htmlFor="id" className="block text-sm font-medium text-ink">
          {dict.lookup.field}
        </label>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
          <input
            id="id"
            name="id"
            type="text"
            required
            defaultValue={rawId}
            autoComplete="off"
            aria-invalid={submitted && !parsed.success ? true : undefined}
            aria-describedby={
              submitted && !parsed.success ? "id-error" : undefined
            }
            className={[
              "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-base outline-none transition-colors",
              "focus:border-brand-600 focus:ring-2 focus:ring-brand-100",
              submitted && !parsed.success ? "border-red-400" : "border-line",
            ].join(" ")}
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-800"
          >
            {dict.lookup.submit}
          </button>
        </div>

        {submitted && !parsed.success && (
          <p id="id-error" className="mt-2 text-sm text-red-600">
            {dict.lookup.invalid}
          </p>
        )}
      </form>

      {submitted && parsed.success && !registration && (
        <div
          role="status"
          className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"
        >
          <span className="text-3xl" aria-hidden="true">
            🔍
          </span>
          <p className="mt-3 text-base font-medium text-amber-900">
            {dict.lookup.notFound}
          </p>
        </div>
      )}

      {registration && settings && (
        <div className="mt-8">
          <p className="mb-4 text-lg font-semibold text-ink">
            {registration.fullName}
          </p>
          <RegistrationStatusPanel
            registration={{
              ...registration,
              payment: registration.payment
                ? {
                    status: registration.payment.status,
                    referenceNumber: registration.payment.referenceNumber,
                    hasReceipt: Boolean(registration.payment.receiptUrl),
                    submittedAt: registration.payment.submittedAt,
                  }
                : null,
            }}
            settings={settings}
            dict={dict}
            locale={lang}
          />
        </div>
      )}

      <div className="mt-8">
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
