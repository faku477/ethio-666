"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import type { RegistrationStatusValue } from "@/lib/status";

type ErrorKey = keyof Dictionary["admin"]["errors"];
type Pending = "approve" | "reject" | null;

/**
 * Approve / reject controls.
 *
 * Both actions ask for confirmation first — they change what a participant is
 * entitled to, and the approve action is what releases a certificate. The
 * confirmation is inline rather than `window.confirm` so it can be styled,
 * translated, and can carry the optional rejection reason.
 */
export function AdminDecisionPanel({
  registrationId,
  status,
  dict,
}: {
  registrationId: string;
  status: RegistrationStatusValue;
  dict: Dictionary;
}) {
  const router = useRouter();

  const [confirming, setConfirming] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approve" | "reject" | null>(null);

  const t = (key: string): string =>
    dict.admin.errors[key as ErrorKey] ?? dict.common.errorTitle;

  async function submit(action: "approve" | "reject") {
    if (working) return;
    setWorking(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/registrations/${encodeURIComponent(registrationId)}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "reject" ? { reason } : {}),
        },
      );

      let result: { success?: boolean; error?: string } | null = null;
      try {
        result = await response.json();
      } catch {
        console.error(`${action} failed: non-JSON response (HTTP ${response.status}).`);
      }

      if (!response.ok || !result?.success) {
        setError(result?.error ?? "serverError");
        setWorking(false);
        return;
      }

      setDone(action);
      setConfirming(null);
      setWorking(false);
      // The page is server-rendered from the database; refresh so the status,
      // the audit trail and the dashboard counts all reflect the decision.
      router.refresh();
    } catch {
      setError("networkError");
      setWorking(false);
    }
  }

  const buttonBase =
    "rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="space-y-4">
      {done && (
        <div
          role="status"
          className={[
            "rounded-lg border px-4 py-3 text-sm font-medium",
            done === "approve"
              ? "border-brand-200 bg-brand-50 text-brand-900"
              : "border-red-200 bg-red-50 text-red-800",
          ].join(" ")}
        >
          {done === "approve"
            ? dict.admin.details.approved
            : dict.admin.details.rejected}
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

      {confirming === null && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConfirming("approve")}
            disabled={working || status === "APPROVED"}
            className={`${buttonBase} bg-brand-700 text-white hover:bg-brand-800`}
          >
            {dict.admin.details.approve}
          </button>

          <button
            type="button"
            onClick={() => setConfirming("reject")}
            disabled={working || status === "REJECTED"}
            className={`${buttonBase} border border-red-300 text-red-700 hover:bg-red-50`}
          >
            {dict.admin.details.reject}
          </button>
        </div>
      )}

      {confirming !== null && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={
            confirming === "approve"
              ? dict.admin.details.approveConfirm
              : dict.admin.details.rejectConfirm
          }
          className="rounded-xl border border-line bg-canvas p-4"
        >
          <p className="text-sm font-medium text-ink">
            {confirming === "approve"
              ? dict.admin.details.approveConfirm
              : dict.admin.details.rejectConfirm}
          </p>

          {confirming === "reject" && (
            <div className="mt-3">
              <label
                htmlFor="reject-reason"
                className="block text-xs font-medium text-muted"
              >
                {dict.admin.details.rejectReason}
              </label>
              <textarea
                id="reject-reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={working}
                className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => submit(confirming)}
              disabled={working}
              className={[
                buttonBase,
                confirming === "approve"
                  ? "bg-brand-700 text-white hover:bg-brand-800"
                  : "bg-red-700 text-white hover:bg-red-800",
              ].join(" ")}
            >
              {working ? dict.admin.details.working : dict.admin.details.confirm}
            </button>

            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={working}
              className={`${buttonBase} border border-line text-ink hover:bg-surface`}
            >
              {dict.admin.details.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
