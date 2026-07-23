import { PaymentInstructions } from "@/components/PaymentInstructions";
import { PaymentStatusBadge, RegistrationStatusBadge } from "@/components/StatusBadge";
import { PaymentSubmissionForm } from "@/components/PaymentSubmissionForm";
import { formatDate, type Dictionary, type Locale } from "@/lib/i18n";
import type { PaymentSettings } from "@/lib/payment-settings";
import {
  canDownloadCertificate,
  REGISTRATION_STATUS_KEYS,
  type PaymentStatusValue,
  type RegistrationStatusValue,
} from "@/lib/status";

export type RegistrationView = {
  registrationId: string;
  certificateNumber: string;
  fullName: string;
  createdAt: Date;
  status: RegistrationStatusValue;
  rejectionReason: string | null;
  payment: {
    status: PaymentStatusValue;
    referenceNumber: string | null;
    hasReceipt: boolean;
    submittedAt: Date;
  } | null;
};

/**
 * Everything a registrant sees about their own registration.
 *
 * Shared by the post-registration success page and the ID-number status lookup
 * so the two can never drift into telling somebody different things. It shows
 * no identification, bank or contact details: it is reachable by anyone holding
 * the registration number or the ID number, and neither is a secret worth
 * trading personal data for.
 */
export function RegistrationStatusPanel({
  registration,
  settings,
  dict,
  locale,
  allowPaymentSubmission = true,
}: {
  registration: RegistrationView;
  settings: PaymentSettings;
  dict: Dictionary;
  locale: Locale;
  /**
   * Whether to show the pay-and-submit-proof section. The registration form now
   * collects payment proof up front, so the post-registration success page
   * passes false — there is no further step there. The ID-number status lookup
   * leaves it true, as the place to submit or correct proof after the fact.
   */
  allowPaymentSubmission?: boolean;
}) {
  const statusKey = REGISTRATION_STATUS_KEYS[registration.status];
  const approved = canDownloadCertificate(registration.status);
  const awaitingPayment =
    registration.status === "PENDING" || registration.status === "REJECTED";
  const paymentSubmitted = registration.status === "PAYMENT_SUBMITTED";

  return (
    <div className="space-y-6">
      <WorkflowSteps status={registration.status} dict={dict} />

      {/* Status */}
      <section
        className={[
          "rounded-2xl border p-5 shadow-sm sm:p-6",
          approved
            ? "border-brand-200 bg-brand-50"
            : registration.status === "REJECTED"
              ? "border-red-200 bg-red-50"
              : "border-line bg-surface",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted">{dict.status.label}</h2>
          <RegistrationStatusBadge status={registration.status} dict={dict} />
        </div>

        <p className="mt-3 text-base text-ink">
          {dict.status.messages[statusKey]}
        </p>

        {registration.status === "REJECTED" && registration.rejectionReason && (
          <p className="mt-3 rounded-lg border border-red-200 bg-surface px-4 py-3 text-sm text-red-800">
            <span className="font-semibold">{dict.status.rejectionReason}: </span>
            {registration.rejectionReason}
          </p>
        )}

        <dl className="mt-5 divide-y divide-line border-t border-line">
          <Row label={dict.success.registrationId}>
            <span className="font-mono font-semibold text-brand-800">
              {registration.registrationId}
            </span>
          </Row>
          <Row label={dict.lookup.registeredOn}>
            {formatDate(registration.createdAt, locale)}
          </Row>
          <Row label={dict.status.paymentLabel}>
            <PaymentStatusBadge
              status={registration.payment?.status ?? null}
              dict={dict}
            />
          </Row>
        </dl>

        {approved && (
          <div className="mt-6 border-t border-brand-200 pt-5">
            <p className="text-sm font-medium text-brand-900">
              {dict.status.certificateReady}
            </p>
            {/* A plain anchor, not <Link>: a route handler serves a file, and
                `download` makes the browser save it instead of rendering it. */}
            <a
              href={`/api/certificate/${registration.registrationId}?lang=${locale}`}
              download
              className="mt-3 inline-block rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-800"
            >
              {dict.success.download}
            </a>
          </div>
        )}

        {!approved && (
          <p className="mt-6 rounded-lg border border-line bg-canvas px-4 py-3 text-sm text-muted">
            🔒 {dict.status.certificateLocked}
          </p>
        )}
      </section>

      {/* Payment on record */}
      {registration.payment && (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-ink">
            {paymentSubmitted
              ? dict.payment.submittedTitle
              : dict.payment.receipt}
          </h2>

          {paymentSubmitted && (
            <p className="mt-2 text-sm text-muted">
              {dict.payment.submittedBody}
            </p>
          )}

          <dl className="mt-4 divide-y divide-line border-t border-line">
            <Row label={dict.payment.reference}>
              {registration.payment.referenceNumber ?? (
                <span className="text-muted">{dict.payment.noReference}</span>
              )}
            </Row>
            <Row label={dict.payment.receipt}>
              {registration.payment.hasReceipt ? (
                <span>{dict.admin.table.yes}</span>
              ) : (
                <span className="text-muted">{dict.payment.noReceipt}</span>
              )}
            </Row>
            <Row label={dict.payment.submittedOn}>
              {formatDate(registration.payment.submittedAt, locale)}
            </Row>
          </dl>
        </section>
      )}

      {/* Pay / submit proof. Hidden once approved: there is nothing left to do,
          and hidden on the success page, where proof was just submitted. */}
      {!approved && allowPaymentSubmission && (
        <>
          <PaymentInstructions settings={settings} dict={dict} />

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <PaymentSubmissionForm
              registrationId={registration.registrationId}
              dict={dict}
              alreadySubmitted={!awaitingPayment && registration.payment !== null}
            />
          </section>
        </>
      )}
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
    <div className="flex flex-wrap items-center justify-between gap-2 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

/** The registration -> payment -> approval -> certificate journey, with the
 *  current position marked. Purely informational. */
function WorkflowSteps({
  status,
  dict,
}: {
  status: RegistrationStatusValue;
  dict: Dictionary;
}) {
  const steps = [
    dict.status.registration.pendingPayment,
    dict.status.registration.paymentSubmitted,
    dict.status.registration.approved,
    dict.success.download,
  ];

  const current =
    status === "APPROVED" ? 3 : status === "PAYMENT_SUBMITTED" ? 1 : 0;

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          <span
            className={[
              "flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium",
              index <= current
                ? "border-brand-300 bg-brand-50 text-brand-800"
                : "border-line bg-surface text-muted",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                index <= current
                  ? "bg-brand-700 text-white"
                  : "bg-line text-muted",
              ].join(" ")}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            {step}
          </span>
          {index < steps.length - 1 && (
            <span className="text-line" aria-hidden="true">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
