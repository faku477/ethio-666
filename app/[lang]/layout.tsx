import type { Metadata } from "next";
import { Inter, Noto_Sans_Ethiopic } from "next/font/google";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary, isLocale, LOCALES, LOCALE_TAGS } from "@/lib/i18n";
import "../globals.css";

const latin = Inter({
  variable: "--font-latin",
  subsets: ["latin"],
  display: "swap",
});

// Variable weight axis: one file covers 100–900, so headings and body text share
// a single download.
const ethiopic = Noto_Sans_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic", "latin"],
  display: "swap",
});

/** Pre-render both locales at build time instead of on first request. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = await getDictionary(lang);
  return {
    title: {
      default: dict.site.name,
      template: `%s — ${dict.site.shortName}`,
    },
    description: dict.site.tagline,
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <html
      lang={LOCALE_TAGS[lang]}
      className={`${latin.variable} ${ethiopic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader locale={lang} dict={dict} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={lang} dict={dict} />
      </body>
    </html>
  );
}
