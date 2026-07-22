/**
 * Registration and payment status presentation.
 *
 * Client-safe on purpose: the status literals are declared here rather than
 * imported from the generated Prisma client, so a badge rendered in a client
 * component does not drag the database client into the browser bundle.
 *
 * Server code assigns Prisma's own status values into these types, so adding a
 * value to the schema enum without adding it here is a compile error.
 */

export type RegistrationStatusValue =
  | "PENDING"
  | "PAYMENT_SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type PaymentStatusValue = "SUBMITTED" | "VERIFIED" | "REJECTED";

/** Key into `dict.status.registration`. */
export const REGISTRATION_STATUS_KEYS = {
  PENDING: "pendingPayment",
  PAYMENT_SUBMITTED: "paymentSubmitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const satisfies Record<RegistrationStatusValue, string>;

/** Key into `dict.status.payment`. `null` — no payment submitted yet. */
export const PAYMENT_STATUS_KEYS = {
  SUBMITTED: "submitted",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const satisfies Record<PaymentStatusValue, string>;

/** Tailwind classes per status. Colour is paired with an icon and a word —
 *  never the only signal, so the badge still reads without colour vision. */
export const REGISTRATION_STATUS_STYLES = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  PAYMENT_SUBMITTED: "border-blue-200 bg-blue-50 text-blue-800",
  APPROVED: "border-brand-200 bg-brand-50 text-brand-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
} as const satisfies Record<RegistrationStatusValue, string>;

export const REGISTRATION_STATUS_ICONS = {
  PENDING: "⏳",
  PAYMENT_SUBMITTED: "🕓",
  APPROVED: "✓",
  REJECTED: "✕",
} as const satisfies Record<RegistrationStatusValue, string>;

export const PAYMENT_STATUS_STYLES = {
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-800",
  VERIFIED: "border-brand-200 bg-brand-50 text-brand-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
} as const satisfies Record<PaymentStatusValue, string>;

export function isRegistrationStatus(
  value: string,
): value is RegistrationStatusValue {
  return value in REGISTRATION_STATUS_KEYS;
}

export function isPaymentStatus(value: string): value is PaymentStatusValue {
  return value in PAYMENT_STATUS_KEYS;
}

/** The single rule that decides whether a certificate exists. Both the API and
 *  the UI call this, so they can never disagree. */
export function canDownloadCertificate(
  status: RegistrationStatusValue,
): boolean {
  return status === "APPROVED";
}
