"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import { passwordChangeSchema } from "@/lib/validation";

type ErrorKey = keyof Dictionary["admin"]["errors"];

/** Password change for the signed-in administrator. */
export function AdminPasswordForm({ dict }: { dict: Dictionary }) {
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

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      currentPassword: String(form.get("currentPassword") ?? ""),
      newPassword: String(form.get("newPassword") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    };

    const parsed = passwordChangeSchema.safeParse(payload);
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
      const response = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result: {
        success?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      } | null = null;
      try {
        result = await response.json();
      } catch {
        console.error(
          `Password change failed: non-JSON response (HTTP ${response.status}).`,
        );
      }

      if (!response.ok || !result?.success) {
        if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
        setError(result?.error ?? (result?.fieldErrors ? null : "serverError"));
        setSaving(false);
        return;
      }

      // Never leave a typed password sitting in the DOM after it has been used.
      formElement.reset();
      setSaved(true);
      setSaving(false);
      // Clears the "change your password" banner in the layout.
      router.refresh();
    } catch {
      setError("networkError");
      setSaving(false);
    }
  }

  const fields = [
    {
      name: "currentPassword",
      label: dict.admin.password.current,
      autoComplete: "current-password",
    },
    {
      name: "newPassword",
      label: dict.admin.password.new,
      autoComplete: "new-password",
      hint: dict.admin.password.hint,
    },
    {
      name: "confirmPassword",
      label: dict.admin.password.confirm,
      autoComplete: "new-password",
    },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {saved && (
        <div
          role="status"
          className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900"
        >
          {dict.admin.password.saved}
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
            type="password"
            autoComplete={field.autoComplete}
            required
            disabled={saving}
            aria-invalid={fieldErrors[field.name] ? true : undefined}
            className={[
              "mt-1.5 w-full rounded-lg border bg-surface px-3.5 py-2.5 text-base outline-none transition-colors",
              "focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:opacity-60",
              fieldErrors[field.name] ? "border-red-400" : "border-line",
            ].join(" ")}
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

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? dict.admin.password.saving : dict.admin.password.submit}
      </button>
    </form>
  );
}
