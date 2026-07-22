"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { adminLoginSchema } from "@/lib/validation";

type ErrorKey = keyof Dictionary["admin"]["errors"];

/**
 * Administrator sign-in.
 *
 * Credentials are posted as JSON to `/api/admin/login`, which sets an
 * httpOnly session cookie. Nothing about the account — not the email, not the
 * password, not a token — is ever kept in client state or storage.
 */
export function AdminLoginForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const t = (key: string): string =>
    dict.admin.errors[key as ErrorKey] ?? dict.common.errorTitle;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);

    const form = new FormData(event.currentTarget);
    const parsed = adminLoginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      let result: { success?: boolean; error?: string } | null = null;
      try {
        result = await response.json();
      } catch {
        console.error(`Login failed: non-JSON response (HTTP ${response.status}).`);
      }

      if (!response.ok || !result?.success) {
        setError(result?.error ?? "serverError");
        setSubmitting(false);
        return;
      }

      // `refresh` first: the layout that guards the dashboard reads the session
      // cookie on the server, and without it the push can race the new cookie.
      router.refresh();
      router.push(localePath(locale, "/admin"));
    } catch {
      setError("networkError");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {t(error)}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          {dict.admin.login.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={submitting}
          className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-ink"
        >
          {dict.admin.login.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={submitting}
          className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-brand-700 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? dict.admin.login.submitting : dict.admin.login.submit}
      </button>
    </form>
  );
}
