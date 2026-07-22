import type { Dictionary } from "@/lib/i18n";
import {
  PAYMENT_STATUS_KEYS,
  PAYMENT_STATUS_STYLES,
  REGISTRATION_STATUS_ICONS,
  REGISTRATION_STATUS_KEYS,
  REGISTRATION_STATUS_STYLES,
  type PaymentStatusValue,
  type RegistrationStatusValue,
} from "@/lib/status";

/**
 * Status pills.
 *
 * Colour is never the only signal: every badge carries an icon and the status
 * word itself, so it still reads on a monochrome print-out or to someone who
 * cannot distinguish the palette.
 */

const BASE =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold";

export function RegistrationStatusBadge({
  status,
  dict,
  className = "",
}: {
  status: RegistrationStatusValue;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <span
      className={`${BASE} ${REGISTRATION_STATUS_STYLES[status]} ${className}`}
    >
      <span aria-hidden="true">{REGISTRATION_STATUS_ICONS[status]}</span>
      {dict.status.registration[REGISTRATION_STATUS_KEYS[status]]}
    </span>
  );
}

export function PaymentStatusBadge({
  status,
  dict,
  className = "",
}: {
  /** `null` — no payment has been submitted yet. */
  status: PaymentStatusValue | null;
  dict: Dictionary;
  className?: string;
}) {
  if (!status) {
    return (
      <span
        className={`${BASE} border-line bg-canvas text-muted ${className}`}
      >
        <span aria-hidden="true">—</span>
        {dict.status.payment.none}
      </span>
    );
  }

  return (
    <span className={`${BASE} ${PAYMENT_STATUS_STYLES[status]} ${className}`}>
      <span aria-hidden="true">
        {status === "VERIFIED" ? "✓" : status === "REJECTED" ? "✕" : "🕓"}
      </span>
      {dict.status.payment[PAYMENT_STATUS_KEYS[status]]}
    </span>
  );
}
