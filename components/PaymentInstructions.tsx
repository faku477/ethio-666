import type { Dictionary } from "@/lib/i18n";
import type { PaymentSettings } from "@/lib/payment-settings";

/**
 * The official payment details a registrant must pay to.
 *
 * Values come from the `PaymentSetting` row an administrator maintains, so bank
 * details can change without a deployment.
 */
export function PaymentInstructions({
  settings,
  dict,
}: {
  settings: PaymentSettings;
  dict: Dictionary;
}) {
  const rows: { label: string; value: string }[] = [
    { label: dict.payment.method, value: settings.paymentMethod },
    { label: dict.payment.accountName, value: settings.accountName },
    { label: dict.payment.accountNumber, value: settings.accountNumber },
    { label: dict.payment.address, value: settings.paymentAddress },
    ...(settings.amount
      ? [{ label: dict.payment.amount, value: settings.amount }]
      : []),
  ];

  return (
    <section className="rounded-2xl border border-gold-500/40 bg-amber-50/60 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
        <span aria-hidden="true">💳</span>
        {dict.payment.infoTitle}
      </h2>

      {settings.configured ? (
        <dl className="mt-4 divide-y divide-gold-500/20">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-2 py-2.5"
            >
              <dt className="text-sm text-muted">{row.label}</dt>
              <dd className="font-semibold break-all text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-amber-900">
          {dict.payment.notConfigured}
        </p>
      )}

      {settings.instructions && (
        <p className="mt-4 border-t border-gold-500/20 pt-4 text-sm whitespace-pre-line text-ink/80">
          {settings.instructions}
        </p>
      )}
    </section>
  );
}
