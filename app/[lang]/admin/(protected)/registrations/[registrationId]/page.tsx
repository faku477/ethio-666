import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminDecisionPanel } from "@/components/admin/AdminDecisionPanel";
import { DeleteRegistrationButton } from "@/components/admin/DeleteRegistrationButton";
import { PaymentStatusBadge, RegistrationStatusBadge } from "@/components/StatusBadge";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin/registrations/[registrationId]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.admin.details.title,
    robots: { index: false, follow: false },
  };
}

/** Formats a timestamp with the time of day — approvals are audit records, and
 *  the date alone is not enough to reconstruct an order of events. */
function formatDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-u-ca-gregory`, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Full registration detail — the page an administrator reviews before deciding.
 *
 * This is the one place in the application that reads `bankAccountNumber`, and
 * it is reachable only behind the admin session guard in the layout above.
 */
export default async function AdminRegistrationDetailPage({
  params,
}: PageProps<"/[lang]/admin/registrations/[registrationId]">) {
  const { lang, registrationId } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  const registration = await prisma.registration.findUnique({
    where: { registrationId },
    select: {
      registrationId: true,
      certificateNumber: true,
      fullName: true,
      identificationId: true,
      phoneNumber: true,
      email: true,
      bankAccountNumber: true,
      photoUrl: true,
      status: true,
      createdAt: true,
      paymentSubmittedAt: true,
      approvedAt: true,
      rejectedAt: true,
      rejectionReason: true,
      approvedBy: { select: { name: true, email: true } },
      payment: {
        select: {
          status: true,
          referenceNumber: true,
          receiptUrl: true,
          receiptMimeType: true,
          submittedAt: true,
          verifiedAt: true,
          verifiedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!registration) notFound();

  const receiptHref = `/api/admin/registrations/${registration.registrationId}/receipt`;
  const receiptIsImage =
    registration.payment?.receiptMimeType?.startsWith("image/") ?? false;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={localePath(lang, "/admin")}
        className="text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
      >
        ← {dict.admin.details.back}
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">
          {dict.admin.details.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <RegistrationStatusBadge status={registration.status} dict={dict} />
          <PaymentStatusBadge
            status={registration.payment?.status ?? null}
            dict={dict}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Registrant */}
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">
            {dict.admin.details.personalSection}
          </h2>

          <div className="mt-4 flex flex-col gap-5 sm:flex-row">
            {/* The participant photo is stored in object storage (or, in
                development, on local disk) and served as-is; next/image would
                need every possible blob host allow-listed for no benefit here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={registration.photoUrl}
              alt={`${dict.admin.details.photo} — ${registration.fullName}`}
              className="h-36 w-36 shrink-0 rounded-xl border border-line object-cover"
            />

            <dl className="min-w-0 flex-1 divide-y divide-line border-t border-line">
              <Row label={dict.register.fields.fullName}>
                {registration.fullName}
              </Row>
              <Row label={dict.admin.table.registrationId}>
                <span className="font-mono font-semibold text-brand-800">
                  {registration.registrationId}
                </span>
              </Row>
              <Row label={dict.success.certificateNumber}>
                <span className="font-mono">{registration.certificateNumber}</span>
              </Row>
              <Row label={dict.register.fields.identificationId}>
                {registration.identificationId}
              </Row>
              <Row label={dict.register.fields.phoneNumber}>
                {registration.phoneNumber}
              </Row>
              <Row label={dict.register.fields.email}>
                {registration.email ?? "—"}
              </Row>
              <Row label={dict.admin.details.bankAccountNumber}>
                <span className="font-mono">{registration.bankAccountNumber}</span>
              </Row>
              <Row label={dict.admin.table.registeredAt}>
                {formatDateTime(registration.createdAt, lang)}
              </Row>
            </dl>
          </div>
        </section>

        {/* Decision */}
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">
            {dict.admin.details.decisionSection}
          </h2>

          <div className="mt-4">
            <AdminDecisionPanel
              registrationId={registration.registrationId}
              status={registration.status}
              dict={dict}
            />
          </div>

          <dl className="mt-5 divide-y divide-line border-t border-line text-sm">
            {registration.approvedAt && (
              <>
                <Row label={dict.admin.details.approvedAt}>
                  {formatDateTime(registration.approvedAt, lang)}
                </Row>
                <Row label={dict.admin.details.approvedBy}>
                  {registration.approvedBy?.name ?? "—"}
                </Row>
              </>
            )}

            {registration.rejectedAt && (
              <Row label={dict.admin.details.rejectedAt}>
                {formatDateTime(registration.rejectedAt, lang)}
              </Row>
            )}

            {registration.rejectionReason && (
              <Row label={dict.status.rejectionReason}>
                {registration.rejectionReason}
              </Row>
            )}
          </dl>

          {registration.status === "APPROVED" && (
            <a
              href={`/api/certificate/${registration.registrationId}?lang=${lang}`}
              download
              className="mt-4 inline-block rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              {dict.admin.details.certificatePreview}
            </a>
          )}

          {/* Destructive, so set apart from the approve/reject controls. */}
          <div className="mt-6 border-t border-red-100 pt-4">
            <DeleteRegistrationButton
              registrationId={registration.registrationId}
              locale={lang}
              dict={dict}
              variant="button"
              redirectToList
            />
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm lg:col-span-3">
          <h2 className="text-base font-semibold text-ink">
            {dict.admin.details.paymentSection}
          </h2>

          {registration.payment ? (
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <dl className="divide-y divide-line border-t border-line">
                <Row label={dict.payment.reference}>
                  {registration.payment.referenceNumber ?? (
                    <span className="text-muted">
                      {dict.payment.noReference}
                    </span>
                  )}
                </Row>
                <Row label={dict.payment.submittedOn}>
                  {formatDateTime(registration.payment.submittedAt, lang)}
                </Row>
                {registration.payment.verifiedAt && (
                  <Row label={dict.admin.details.verifiedBy}>
                    {registration.payment.verifiedBy?.name ?? "—"} ·{" "}
                    {formatDateTime(registration.payment.verifiedAt, lang)}
                  </Row>
                )}
              </dl>

              <div>
                <p className="text-sm font-medium text-ink">
                  {dict.payment.receipt}
                </p>

                {registration.payment.receiptUrl ? (
                  <div className="mt-2">
                    {receiptIsImage ? (
                      // Streamed through the authenticated receipt route, never
                      // from the storage URL — see the route for why.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={receiptHref}
                        alt={dict.admin.details.receiptPreviewAlt}
                        className="max-h-96 w-full rounded-xl border border-line bg-canvas object-contain"
                      />
                    ) : (
                      <p className="rounded-xl border border-line bg-canvas px-4 py-6 text-center text-sm text-muted">
                        PDF
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3">
                      <a
                        href={receiptHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-300 hover:text-brand-800"
                      >
                        {dict.admin.details.openReceipt}
                      </a>
                      <a
                        href={receiptHref}
                        download
                        className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-300 hover:text-brand-800"
                      >
                        {dict.admin.details.downloadReceipt}
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    {dict.payment.noReceipt}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              {dict.admin.details.noPayment}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-right break-words text-ink">{children}</dd>
    </div>
  );
}
