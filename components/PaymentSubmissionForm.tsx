"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import {
  ALLOWED_RECEIPT_TYPES,
  validatePaymentSubmission,
  type PaymentFieldErrors,
} from "@/lib/validation";

type Props = {
  registrationId: string;
  dict: Dictionary;
  /** Rendered collapsed when payment proof is already on record. */
  alreadySubmitted?: boolean;
};

type ErrorKey = keyof Dictionary["payment"]["errors"];

/**
 * Receipt / reference submission.
 *
 * Validation runs here only to save a round trip — the same rules run again in
 * the route handler, which is the one that decides.
 */
export function PaymentSubmissionForm({
  registrationId,
  dict,
  alreadySubmitted = false,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(!alreadySubmitted);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PaymentFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const t = (key: string): string =>
    dict.payment.errors[key as ErrorKey] ?? dict.common.errorTitle;

  function handleReceiptChange(event: React.ChangeEvent<HTMLInputElement>) {
    setReceipt(event.target.files?.[0] ?? null);
    setFieldErrors((prev) => ({ ...prev, receipt: undefined }));
  }

  function removeReceipt() {
    setReceipt(null);
    // Without clearing the input, re-picking the same file fires no change
    // event and the selection silently fails to come back.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setFormError(null);

    const form = new FormData(event.currentTarget);
    const reference = String(form.get("reference") ?? "");

    const errors = validatePaymentSubmission({ reference, receipt });
    if (Object.keys(errors).length > 0) {
      const { form: formLevel, ...fields } = errors;
      setFieldErrors(fields);
      if (formLevel) setFormError(formLevel);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.set("reference", reference.trim());
      if (receipt) payload.set("receipt", receipt);

      const response = await fetch(
        `/api/registration/${encodeURIComponent(registrationId)}/payment`,
        { method: "POST", body: payload },
      );

      // Parse defensively: a platform error page or a 413 from an oversized
      // body is not JSON, and letting `.json()` throw would report a genuine
      // server fault as a connection problem.
      let result: {
        success?: boolean;
        error?: string;
        fieldErrors?: PaymentFieldErrors;
      } | null = null;

      try {
        result = await response.json();
      } catch {
        console.error(
          `Payment submission failed: non-JSON response (HTTP ${response.status}).`,
        );
      }

      if (!response.ok || !result?.success) {
        if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
        if (result?.error) {
          setFormError(result.error);
        } else if (!result?.fieldErrors) {
          setFormError(
            response.status === 413 ? "receiptTooLarge" : "serverError",
          );
        }
        setSubmitting(false);
        return;
      }

      // The status panel above this form is server-rendered; refresh so it
      // re-reads the registration and shows the new status.
      removeReceipt();
      router.refresh();
      setSubmitting(false);
      setOpen(false);
    } catch {
      setFormError("networkError");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
      >
        {dict.payment.resubmit}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-ink">
          {dict.payment.submitTitle}
        </h2>
        <p className="mt-1 text-sm text-muted">{dict.payment.submitIntro}</p>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {t(formError)}
        </div>
      )}

      <div>
        <label
          htmlFor="reference"
          className="block text-sm font-medium text-ink"
        >
          {dict.payment.referenceLabel}
        </label>
        <input
          id="reference"
          name="reference"
          type="text"
          inputMode="text"
          autoComplete="off"
          disabled={submitting}
          aria-invalid={fieldErrors.reference ? true : undefined}
          aria-describedby={
            fieldErrors.reference ? "reference-error" : "reference-hint"
          }
          className={[
            "mt-1.5 w-full rounded-lg border bg-surface px-3.5 py-2.5 text-base outline-none transition-colors",
            "focus:border-brand-600 focus:ring-2 focus:ring-brand-100",
            "disabled:cursor-not-allowed disabled:opacity-60",
            fieldErrors.reference ? "border-red-400" : "border-line",
          ].join(" ")}
        />
        {fieldErrors.reference ? (
          <p id="reference-error" className="mt-1.5 text-sm text-red-600">
            {t(fieldErrors.reference)}
          </p>
        ) : (
          <p id="reference-hint" className="mt-1.5 text-xs text-muted">
            {dict.payment.referenceHint}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="receipt" className="block text-sm font-medium text-ink">
          {dict.payment.receiptLabel}
        </label>
        <input
          ref={fileInputRef}
          id="receipt"
          name="receipt"
          type="file"
          accept={ALLOWED_RECEIPT_TYPES.join(",")}
          onChange={handleReceiptChange}
          disabled={submitting}
          aria-invalid={fieldErrors.receipt ? true : undefined}
          aria-describedby={
            fieldErrors.receipt ? "receipt-error" : "receipt-hint"
          }
          className="mt-1.5 block w-full text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-800 hover:file:bg-brand-100"
        />
        {fieldErrors.receipt ? (
          <p id="receipt-error" className="mt-1.5 text-sm text-red-600">
            {t(fieldErrors.receipt)}
          </p>
        ) : (
          <p id="receipt-hint" className="mt-1.5 text-xs text-muted">
            {dict.payment.receiptHint}
          </p>
        )}

        {receipt && (
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink">
            <span className="font-medium break-all">
              {dict.payment.receiptSelected}: {receipt.name}
            </span>
            <button
              type="button"
              onClick={removeReceipt}
              disabled={submitting}
              className="font-medium text-red-700 underline underline-offset-2 hover:text-red-800"
            >
              {dict.payment.receiptRemove}
            </button>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? dict.payment.submitting : dict.payment.submit}
        </button>

        {alreadySubmitted && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="text-sm font-medium text-muted underline underline-offset-2 hover:text-ink"
          >
            {dict.admin.details.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
