"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import type { PaymentSettings } from "@/lib/payment-settings";
import { paymentSettingsSchema } from "@/lib/validation";

type ErrorKey = keyof Dictionary["admin"]["errors"];

/** Editor for the payment instructions shown to every registrant. */
export function PaymentSettingsForm({
  settings,
  dict,
}: {
  settings: PaymentSettings;
  dict: Dictionary;
}) {
  const router = useRouter();

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const t = (key: string): string =>
    dict.admin.errors[key as ErrorKey] ?? dict.common.errorTitle;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setError(null);
    setSaved(false);

    const form = new FormData(event.currentTarget);
    const parsed = paymentSettingsSchema.safeParse({
      paymentMethod: form.get("paymentMethod"),
      accountName: form.get("accountName"),
      accountNumber: form.get("accountNumber"),
      paymentAddress: form.get("paymentAddress"),
      amount: form.get("amount"),
      instructions: form.get("instructions"),
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "form");
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      let result: {
        success?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      } | null = null;
      try {
        result = await response.json();
      } catch {
        console.error(`Save failed: non-JSON response (HTTP ${response.status}).`);
      }

      if (!response.ok || !result?.success) {
        if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
        setError(result?.error ?? (result?.fieldErrors ? null : "serverError"));
        setSaving(false);
        return;
      }

      setSaved(true);
      setSaving(false);
      router.refresh();
    } catch {
      setError("networkError");
      setSaving(false);
    }
  }

  const fields = [
    {
      name: "paymentMethod",
      label: dict.payment.method,
      defaultValue: settings.paymentMethod,
    },
    {
      name: "accountName",
      label: dict.payment.accountName,
      defaultValue: settings.accountName,
    },
    {
      name: "accountNumber",
      label: dict.payment.accountNumber,
      defaultValue: settings.accountNumber,
    },
    {
      name: "paymentAddress",
      label: dict.payment.address,
      defaultValue: settings.paymentAddress,
    },
    {
      name: "amount",
      label: dict.payment.amount,
      defaultValue: settings.amount ?? "",
      hint: dict.admin.settings.amountHint,
    },
  ];

  const inputClass =
    "mt-1.5 w-full rounded-lg border bg-surface px-3.5 py-2.5 text-base outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {saved && (
        <div
          role="status"
          className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900"
        >
          {dict.admin.settings.saved}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {t(error)}
        </div>
      )}

      {fields.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="block text-sm font-medium text-ink"
          >
            {field.label}
          </label>
          <input
            id={field.name}
            name={field.name}
            type="text"
            defaultValue={field.defaultValue}
            disabled={saving}
            aria-invalid={fieldErrors[field.name] ? true : undefined}
            className={`${inputClass} ${
              fieldErrors[field.name] ? "border-red-400" : "border-line"
            }`}
          />
          {fieldErrors[field.name] ? (
            <p className="mt-1.5 text-sm text-red-600">
              {t(fieldErrors[field.name]!)}
            </p>
          ) : (
            field.hint && (
              <p className="mt-1.5 text-xs text-muted">{field.hint}</p>
            )
          )}
        </div>
      ))}

      <div>
        <label
          htmlFor="instructions"
          className="block text-sm font-medium text-ink"
        >
          {dict.payment.instructions}
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={4}
          defaultValue={settings.instructions ?? ""}
          disabled={saving}
          className={`${inputClass} ${
            fieldErrors.instructions ? "border-red-400" : "border-line"
          }`}
        />
        <p className="mt-1.5 text-xs text-muted">
          {dict.admin.settings.instructionsHint}
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? dict.admin.settings.saving : dict.admin.settings.save}
      </button>
    </form>
  );
}
