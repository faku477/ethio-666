import Link from "next/link";
import { notFound } from "next/navigation";

import { Logo } from "@/components/Logo";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-brand-50 to-canvas">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <Logo className="mx-auto h-16 w-16" />

          <p className="mt-6 inline-block rounded-full border border-brand-200 bg-brand-50 px-4 py-1 text-sm font-medium text-brand-800">
            {dict.home.eventName}
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            {dict.home.title}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg">
            {dict.home.description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={localePath(lang, "/register")}
              className="w-full rounded-xl bg-brand-700 px-8 py-3.5 text-center text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 sm:w-auto"
            >
              {dict.home.ctaPrimary}
            </Link>
            <a
              href="#steps"
              className="w-full rounded-xl border border-line bg-surface px-8 py-3.5 text-center text-base font-semibold text-ink transition-colors hover:border-brand-300 hover:text-brand-700 sm:w-auto"
            >
              {dict.home.stepsTitle}
            </a>
          </div>
        </div>
      </section>

      <section id="steps" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">
          {dict.home.stepsTitle}
        </h2>

        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {dict.home.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-base font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-brand-900">
            {dict.home.securityTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-brand-900/80">
            {dict.home.securityBody}
          </p>
        </div>
      </section>
    </>
  );
}
