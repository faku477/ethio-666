import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminFilters } from "@/components/admin/AdminFilters";
import { PaymentStatusBadge, RegistrationStatusBadge } from "@/components/StatusBadge";
import type { Prisma } from "@/lib/generated/prisma/client";
import {
  formatDate,
  getDictionary,
  isLocale,
  localePath,
  type Locale,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import {
  isPaymentStatus,
  isRegistrationStatus,
  type RegistrationStatusValue,
} from "@/lib/status";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/admin">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.admin.nav.dashboard,
    robots: { index: false, follow: false },
  };
}

const PAGE_SIZE = 25;

/** Parses `YYYY-MM-DD` from a filter input. Returns null for anything else. */
function parseDate(value: string | undefined, endOfDay = false): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDashboardPage({
  params,
  searchParams,
}: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const query = await searchParams;

  // Bound outside the closures below: TypeScript drops the `isLocale` narrowing
  // when `lang` is read inside a nested function.
  const locale: Locale = lang;

  const q = (first(query.q) ?? "").trim();
  const statusFilter = first(query.status) ?? "";
  const paymentFilter = first(query.payment) ?? "";
  const from = first(query.from) ?? "";
  const to = first(query.to) ?? "";
  const page = Math.max(1, Number.parseInt(first(query.page) ?? "1", 10) || 1);

  const where: Prisma.RegistrationWhereInput = {};

  if (q) {
    // One box searching every identifier an administrator is likely to have on
    // a piece of paper in front of them.
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { identificationId: { contains: q, mode: "insensitive" } },
      { phoneNumber: { contains: q } },
      { registrationId: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (isRegistrationStatus(statusFilter)) {
    where.status = statusFilter;
  }

  if (paymentFilter === "NONE") {
    where.payment = { is: null };
  } else if (isPaymentStatus(paymentFilter)) {
    where.payment = { is: { status: paymentFilter } };
  }

  const fromDate = parseDate(from);
  const toDate = parseDate(to, true);
  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  // Statistics cover every registration, not the filtered subset: they are a
  // picture of the whole queue, which is what the cards are read for.
  const [grouped, total, matching, registrations] = await Promise.all([
    prisma.registration.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.registration.count(),
    prisma.registration.count({ where }),
    prisma.registration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        registrationId: true,
        fullName: true,
        identificationId: true,
        phoneNumber: true,
        email: true,
        createdAt: true,
        status: true,
        payment: {
          select: {
            status: true,
            referenceNumber: true,
            receiptUrl: true,
          },
        },
      },
    }),
  ]);

  const counts = Object.fromEntries(
    grouped.map((row) => [row.status, row._count._all]),
  ) as Partial<Record<RegistrationStatusValue, number>>;

  const stats = [
    { label: dict.admin.stats.total, value: total, tone: "border-line bg-surface" },
    {
      label: dict.admin.stats.pendingPayment,
      value: counts.PENDING ?? 0,
      tone: "border-amber-200 bg-amber-50",
    },
    {
      label: dict.admin.stats.paymentSubmitted,
      value: counts.PAYMENT_SUBMITTED ?? 0,
      tone: "border-blue-200 bg-blue-50",
    },
    {
      label: dict.admin.stats.approved,
      value: counts.APPROVED ?? 0,
      tone: "border-brand-200 bg-brand-50",
    },
    {
      label: dict.admin.stats.rejected,
      value: counts.REJECTED ?? 0,
      tone: "border-red-200 bg-red-50",
    },
  ];

  const pageCount = Math.max(1, Math.ceil(matching / PAGE_SIZE));

  /** Keeps the active filters when moving between pages. */
  function pageHref(target: number): string {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (statusFilter) search.set("status", statusFilter);
    if (paymentFilter) search.set("payment", paymentFilter);
    if (from) search.set("from", from);
    if (to) search.set("to", to);
    if (target > 1) search.set("page", String(target));
    const suffix = search.toString();
    return localePath(locale, `/admin${suffix ? `?${suffix}` : ""}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">{dict.admin.nav.dashboard}</h1>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-4 shadow-sm ${stat.tone}`}
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-6">
        <AdminFilters
          locale={lang}
          dict={dict}
          values={{ q, status: statusFilter, payment: paymentFilter, from, to }}
        />
      </div>

      <p className="mt-4 text-sm text-muted">
        {matching} {dict.admin.filters.results}
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-surface shadow-sm">
        <table className="w-full min-w-[64rem] text-left text-sm">
          <thead className="border-b border-line bg-canvas text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.registrationId}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.fullName}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.identificationId}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.phoneNumber}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.email}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.registeredAt}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.status}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.paymentStatus}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.reference}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.receipt}
              </th>
              <th className="px-4 py-3 font-semibold">
                {dict.admin.table.actions}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {registrations.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-muted">
                  {dict.admin.table.empty}
                </td>
              </tr>
            )}

            {registrations.map((registration) => (
              <tr key={registration.registrationId} className="hover:bg-canvas">
                <td className="px-4 py-3 font-mono font-semibold whitespace-nowrap text-brand-800">
                  {registration.registrationId}
                </td>
                <td className="px-4 py-3 font-medium text-ink">
                  {registration.fullName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {registration.identificationId}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {registration.phoneNumber}
                </td>
                <td className="px-4 py-3">{registration.email ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(registration.createdAt, lang)}
                </td>
                <td className="px-4 py-3">
                  <RegistrationStatusBadge
                    status={registration.status}
                    dict={dict}
                  />
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge
                    status={registration.payment?.status ?? null}
                    dict={dict}
                  />
                </td>
                <td className="px-4 py-3">
                  {registration.payment?.referenceNumber ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {registration.payment?.receiptUrl
                    ? dict.admin.table.yes
                    : dict.admin.table.no}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    href={localePath(
                      lang,
                      `/admin/registrations/${registration.registrationId}`,
                    )}
                    className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
                  >
                    {dict.admin.table.view}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-3 text-sm">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="rounded-lg border border-line bg-surface px-4 py-2 font-medium text-ink hover:border-brand-300"
            >
              {dict.admin.table.previous}
            </Link>
          ) : (
            <span />
          )}

          <span className="text-muted">
            {dict.admin.table.page} {page} / {pageCount}
          </span>

          {page < pageCount ? (
            <Link
              href={pageHref(page + 1)}
              className="rounded-lg border border-line bg-surface px-4 py-2 font-medium text-ink hover:border-brand-300"
            >
              {dict.admin.table.next}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
