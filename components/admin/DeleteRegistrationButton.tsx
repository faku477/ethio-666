"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { localePath, type Dictionary, type Locale } from "@/lib/i18n";

type ErrorKey = keyof Dictionary["admin"]["errors"];

/**
 * Deletes a registration after an inline confirmation.
 *
 * Two visual variants share one flow:
 *   - "link"   a compact red link for the dashboard table's Action column
 *   - "button" a full button for the detail page's danger area
 *
 * On success it either refreshes the current route (table) or navigates back to
 * the dashboard (detail page, whose record no longer exists), decided by
 * `redirectToList`.
 */
export function DeleteRegistrationButton({
  registrationId,
  locale,
  dict,
  variant = "link",
  redirectToList = false,
}: {
  registrationId: string;
  locale: Locale;
  dict: Dictionary;
  variant?: "link" | "button";
  redirectToList?: boolean;
}) {
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (key: string): string =>
    dict.admin.errors[key as ErrorKey] ?? dict.common.errorTitle;

  async function remove() {
    if (working) return;
    setWorking(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/registrations/${encodeURIComponent(registrationId)}`,
        { method: "DELETE" },
      );

      let result: { success?: boolean; error?: string } | null = null;
      try {
        result = await response.json();
      } catch {
        console.error(`Delete failed: non-JSON response (HTTP ${response.status}).`);
      }

      if (!response.ok || !result?.success) {
        setError(result?.error ?? "deleteFailed");
        setWorking(false);
        return;
      }

      if (redirectToList) {
        router.push(localePath(locale, "/admin"));
      }
      // Refresh either way: the dashboard row must disappear, and the pushed
      // navigation still needs the server data re-read.
      router.refresh();
    } catch {
      setError("networkError");
      setWorking(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className={
          variant === "button"
            ? "rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
            : "text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-800"
        }
      >
        {dict.admin.details.delete}
      </button>
    );
  }

  return (
    <div
      className={
        variant === "button"
          ? "rounded-xl border border-red-200 bg-red-50 p-4"
          : "flex flex-col gap-2"
      }
    >
      {variant === "button" && (
        <p className="text-sm font-medium text-red-900">
          {dict.admin.details.deleteConfirm}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {t(error)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={remove}
          disabled={working}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {working ? dict.admin.details.working : dict.admin.details.delete}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={working}
          className="text-sm font-medium text-muted underline underline-offset-2 hover:text-ink"
        >
          {dict.admin.details.cancel}
        </button>
      </div>
    </div>
  );
}
