"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import {
  ALLOWED_PHOTO_TYPES,
  collectFieldErrors,
  registrationSchema,
  validatePhotoMeta,
  type FieldErrors,
} from "@/lib/validation";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

type ErrorKey = keyof Dictionary["register"]["errors"];

/** The chosen file plus the object URL rendered as its preview. */
type SelectedPhoto = { file: File; url: string };

const FIELDS = [
  "fullName",
  "identificationId",
  "phoneNumber",
  "bankAccountNumber",
  "email",
] as const;

/**
 * Declared at module scope, NOT inside RegistrationForm.
 *
 * A component defined inside another component is a brand new type on every
 * render, so React unmounts and remounts it whenever the parent re-renders.
 * These inputs are uncontrolled, so a remount would discard whatever the user
 * had typed — every validation error would clear the whole form.
 */
function TextField({
  name,
  label,
  error,
  errorText,
  optionalLabel,
  required = true,
  type = "text",
  inputMode,
  autoComplete,
  hint,
  disabled,
}: {
  name: string;
  label: string;
  error?: string;
  errorText?: string;
  optionalLabel: string;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "tel" | "numeric" | "email";
  autoComplete?: string;
  hint?: string;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-2 text-xs font-normal text-muted">
            ({optionalLabel})
          </span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${name}-error` : hint ? `${name}-hint` : undefined
        }
        disabled={disabled}
        className={[
          "mt-1.5 w-full rounded-lg border bg-surface px-3.5 py-2.5 text-base outline-none transition-colors",
          "focus:border-brand-600 focus:ring-2 focus:ring-brand-100",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-red-400" : "border-line",
        ].join(" ")}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-red-600">
          {errorText}
        </p>
      )}
    </div>
  );
}

export function RegistrationForm({ locale, dict }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Object URLs are never reclaimed automatically, so each one must be revoked
  // or the page holds the full image in memory for every photo the user tries.
  // The URL is created in the change handler rather than in an effect keyed on
  // the file: doing it in an effect means setState during render-commit, which
  // triggers a second cascading render for every selection.
  const previewUrlRef = useRef<string | null>(null);

  function selectPhoto(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!file) {
      setPhoto(null);
      return;
    }

    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPhoto({ file, url });
  }

  // Revoke whatever is still outstanding when the form unmounts.
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const t = (key: string): string =>
    dict.register.errors[key as ErrorKey] ?? dict.common.errorTitle;

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    selectPhoto(event.target.files?.[0] ?? null);
    setFieldErrors((prev) => ({ ...prev, photo: undefined }));
  }

  function removePhoto() {
    selectPhoto(null);
    // Clearing the input's value matters: without it, re-picking the same file
    // fires no change event and the photo silently fails to come back.
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setFormError(null);
    const form = new FormData(event.currentTarget);

    // Same schema the server runs — this only saves a round trip.
    const parsed = registrationSchema.safeParse({
      fullName: form.get("fullName"),
      identificationId: form.get("identificationId"),
      phoneNumber: form.get("phoneNumber"),
      bankAccountNumber: form.get("bankAccountNumber"),
      email: form.get("email") ?? "",
    });

    const photoError = validatePhotoMeta(photo?.file ?? null);
    const errors: FieldErrors = parsed.success
      ? {}
      : collectFieldErrors(parsed.error);
    if (photoError) errors.photo = photoError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = new FormData();
      for (const field of FIELDS) {
        payload.set(field, String(form.get(field) ?? ""));
      }
      payload.set("photo", (photo as SelectedPhoto).file);

      const response = await fetch("/api/register", {
        method: "POST",
        body: payload,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
        if (result?.error) setFormError(result.error);
        else if (!result?.fieldErrors) setFormError("serverError");
        setSubmitting(false);
        return;
      }

      // Stay in the submitting state through the navigation so the button
      // cannot be pressed twice while the new page loads.
      router.push(localePath(locale, `/success/${result.registrationId}`));
    } catch {
      setFormError("networkError");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {t(formError)}
        </div>
      )}

      <TextField
        name="fullName"
        label={dict.register.fields.fullName}
        autoComplete="name"
        error={fieldErrors.fullName}
        errorText={fieldErrors.fullName && t(fieldErrors.fullName)}
        optionalLabel={dict.register.optional}
        disabled={submitting}
      />

      <TextField
        name="identificationId"
        label={dict.register.fields.identificationId}
        error={fieldErrors.identificationId}
        errorText={
          fieldErrors.identificationId && t(fieldErrors.identificationId)
        }
        optionalLabel={dict.register.optional}
        disabled={submitting}
      />

      <TextField
        name="phoneNumber"
        label={dict.register.fields.phoneNumber}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint={dict.register.hints.phoneNumber}
        error={fieldErrors.phoneNumber}
        errorText={fieldErrors.phoneNumber && t(fieldErrors.phoneNumber)}
        optionalLabel={dict.register.optional}
        disabled={submitting}
      />

      <TextField
        name="bankAccountNumber"
        label={dict.register.fields.bankAccountNumber}
        inputMode="numeric"
        hint={dict.register.hints.bankAccountNumber}
        error={fieldErrors.bankAccountNumber}
        errorText={
          fieldErrors.bankAccountNumber && t(fieldErrors.bankAccountNumber)
        }
        optionalLabel={dict.register.optional}
        disabled={submitting}
      />


      {/* Photo */}
      <div>
        <span className="block text-sm font-medium text-ink">
          {dict.register.fields.photo}
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        </span>

        <div className="mt-1.5 flex items-start gap-4">
          {photo && (
            // The source is a local blob: URL for a file that has not been
            // uploaded yet; next/image optimizes remote/static sources and
            // cannot process it.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.url}
              alt={dict.register.photo.previewAlt}
              className="h-28 w-28 shrink-0 rounded-lg border border-line object-cover"
            />
          )}

          <div className="flex-1">
            <input
              ref={fileInputRef}
              id="photo"
              name="photo"
              type="file"
              accept={ALLOWED_PHOTO_TYPES.join(",")}
              onChange={handlePhotoChange}
              disabled={submitting}
              aria-required
              aria-invalid={fieldErrors.photo ? true : undefined}
              aria-describedby={
                fieldErrors.photo ? "photo-error" : "photo-hint"
              }
              className="block w-full text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-800 hover:file:bg-brand-100"
            />

            {!fieldErrors.photo && (
              <p id="photo-hint" className="mt-1.5 text-xs text-muted">
                {dict.register.photo.hint}
              </p>
            )}

            {fieldErrors.photo && (
              <p id="photo-error" className="mt-1.5 text-sm text-red-600">
                {t(fieldErrors.photo)}
              </p>
            )}

            {photo && (
              <button
                type="button"
                onClick={removePhoto}
                disabled={submitting}
                className="mt-2 text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-800"
              >
                {dict.register.photo.remove}
              </button>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-brand-700 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? dict.register.submitting : dict.register.submit}
      </button>
    </form>
  );
}
