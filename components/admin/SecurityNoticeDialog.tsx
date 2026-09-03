"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { localePath, type Locale } from "@/lib/i18n";

/**
 * The bilingual warning every administrator must acknowledge after logging in.
 *
 * The copy lives here rather than in the locale dictionaries on purpose: the
 * notice shows Amharic *and* English together whatever the interface language
 * is, so there is one text, not one per locale.
 */
const NOTICE = {
  am: {
    title: "ማስጠንቀቂያ፦ ስርዓትዎ በቅርቡ ሊቋረጥ ነው",
    body:
      "በስርዓቱ ላይ የተጠረጠረ የማጭበርበር ይዘት በመገኘቱ ምክንያት ስርዓትዎ በቅርቡ ከአገልግሎት ውጭ ይደረጋል። " +
      "ይህ ስህተት ነው ብለው የሚያምኑ ከሆነ እባክዎ ወዲያውኑ የስርዓት አገልግሎት ማዕከላችንን ያግኙ።",
    contact: "የአገልግሎት ማዕከል፦",
    ok: "እሺ",
    cancel: "ተወው",
  },
  en: {
    title: "Warning: your system will be deactivated soon",
    body:
      "Your system will be deactivated soon because suspected fraudulent content was found on it. " +
      "If you believe this is not the case, please contact our system contact center immediately.",
    contact: "Contact center:",
    ok: "OK",
    cancel: "Cancel",
  },
} as const;

/** Edit these to the real contact center details. */
const CONTACT_PHONE = "+251 11 000 0000";
const CONTACT_EMAIL = "support@example.com";

/** Where the acknowledgement for the current login is remembered. */
const ACK_KEY = "admin.securityNotice.ack";
const LOGIN_MARKER_COOKIE = "admin_login_id";

function readLoginMarker(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOGIN_MARKER_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]!) : null;
}

/**
 * Reads whether this login still owes an acknowledgement.
 *
 * Subscribed through `useSyncExternalStore` rather than an effect: the answer
 * comes from the cookie and from `localStorage`, both outside React, and the
 * server snapshot is `false` so the prerendered HTML carries no dialog. Nothing
 * pushes updates — the value only changes when this component writes it — so
 * `subscribe` hands back a no-op unsubscribe.
 */
function subscribeToNotice(): () => void {
  return () => {};
}

function noticePending(): boolean {
  // No marker means a session predating this feature, or a browser that dropped
  // the cookie. Show the notice rather than silently skipping it.
  const marker = readLoginMarker();
  if (!marker) return true;

  try {
    return window.localStorage.getItem(ACK_KEY) !== marker;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). Then the
    // notice simply shows every time, which is the safe direction.
    return true;
  }
}

/**
 * Shows the warning once per login.
 *
 * The marker cookie changes on every `createSession`, so comparing it against
 * the acknowledged value in `localStorage` reopens the dialog for a new login
 * while leaving it closed as the administrator moves between admin pages.
 * `localStorage` — not `sessionStorage` — so reopening the browser inside the
 * same login does not ask again.
 */
export function SecurityNoticeDialog({ locale }: { locale: Locale }) {
  const router = useRouter();

  const pending = useSyncExternalStore(
    subscribeToNotice,
    noticePending,
    () => false,
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const okRef = useRef<HTMLButtonElement>(null);

  const open = pending && !acknowledged;

  // Move focus into the dialog so it is announced, and keep the page behind it
  // from scrolling while it is up.
  useEffect(() => {
    if (!open) return;

    okRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  function acknowledge() {
    try {
      // A missing marker cannot be matched against later; store a value anyway
      // so a later login with a marker still asks again.
      window.localStorage.setItem(ACK_KEY, readLoginMarker() ?? "acknowledged");
    } catch {
      // Unwritable storage only means the notice appears again next time.
    }
    setAcknowledged(true);
  }

  /** Cancel declines the notice and leaves the system, ending the session. */
  async function cancel() {
    if (leaving) return;
    setLeaving(true);

    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // The session cookie is httpOnly and cannot be cleared here; the
      // server-side guard re-checks on the next request either way.
    }

    router.refresh();
    router.push(localePath(locale, "/admin/login"));
  }

  if (!open) return null;

  const am = NOTICE.am;
  const en = NOTICE.en;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-notice-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-surface p-6 shadow-lg sm:p-8">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="text-2xl">
            ⚠️
          </span>
          <div>
            <h2
              id="security-notice-title"
              lang="am"
              className="text-lg font-bold text-red-800"
            >
              {am.title}
            </h2>
            <h3 lang="en" className="mt-1 text-base font-bold text-red-800">
              {en.title}
            </h3>
          </div>
        </div>

        <p lang="am" className="mt-5 text-sm leading-relaxed text-ink">
          {am.body}
        </p>
        <p lang="en" className="mt-4 text-sm leading-relaxed text-ink">
          {en.body}
        </p>

        <div className="mt-5 rounded-xl border border-line bg-amber-50 p-4 text-sm text-amber-900">
          <p lang="am" className="font-semibold">
            {am.contact} <span dir="ltr">{CONTACT_PHONE}</span>
          </p>
          <p lang="en" className="mt-1">
            {en.contact} <span dir="ltr">{CONTACT_PHONE}</span> ·{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={cancel}
            disabled={leaving}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-60"
          >
            {am.cancel} / {en.cancel}
          </button>
          <button
            ref={okRef}
            type="button"
            onClick={acknowledge}
            disabled={leaving}
            className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
          >
            {am.ok} / {en.ok}
          </button>
        </div>
      </div>
    </div>
  );
}
