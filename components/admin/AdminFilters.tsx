import Link from "next/link";

import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { PAYMENT_STATUS_KEYS, REGISTRATION_STATUS_KEYS } from "@/lib/status";

/**
 * Dashboard search and filters.
 *
 * A plain GET form, deliberately: the resulting URL is shareable and
 * bookmarkable, the back button behaves, and the whole thing works with no
 * client JavaScript at all.
 */
export function AdminFilters({
  locale,
  dict,
  values,
}: {
  locale: Locale;
  dict: Dictionary;
  values: {
    q: string;
    status: string;
    payment: string;
    from: string;
    to: string;
  };
}) {
  const inputClass =
    "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

  return (
    <form
      method="get"
      className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label htmlFor="q" className="text-xs font-medium text-muted">
            {dict.admin.filters.title}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={values.q}
            placeholder={dict.admin.filters.search}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="status" className="text-xs font-medium text-muted">
            {dict.admin.filters.status}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={values.status}
            className={inputClass}
          >
            <option value="">{dict.admin.filters.all}</option>
            {Object.entries(REGISTRATION_STATUS_KEYS).map(([value, key]) => (
              <option key={value} value={value}>
                {dict.status.registration[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="payment" className="text-xs font-medium text-muted">
            {dict.admin.filters.paymentStatus}
          </label>
          <select
            id="payment"
            name="payment"
            defaultValue={values.payment}
            className={inputClass}
          >
            <option value="">{dict.admin.filters.all}</option>
            <option value="NONE">{dict.status.payment.none}</option>
            {Object.entries(PAYMENT_STATUS_KEYS).map(([value, key]) => (
              <option key={value} value={value}>
                {dict.status.payment[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="from" className="text-xs font-medium text-muted">
            {dict.admin.filters.from}
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={values.from}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="to" className="text-xs font-medium text-muted">
            {dict.admin.filters.to}
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={values.to}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          {dict.admin.filters.apply}
        </button>
        <Link
          href={localePath(locale, "/admin")}
          className="text-sm font-medium text-muted underline underline-offset-2 hover:text-ink"
        >
          {dict.admin.filters.reset}
        </Link>
      </div>
    </form>
  );
}
