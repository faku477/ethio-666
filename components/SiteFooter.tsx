import { type Dictionary, type Locale } from "@/lib/i18n";

export function SiteFooter({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  // Rendered on the server at build time; a fixed year would go stale, and
  // `new Date()` here is evaluated per render/revalidation.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {year} {dict.site.name}. {dict.footer.rights}
        </p>
        <p lang={locale} className="max-w-md sm:text-right">
          {dict.footer.verifyPrompt}
        </p>
      </div>
    </footer>
  );
}
