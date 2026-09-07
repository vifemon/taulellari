import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppI18nProvider } from "@/i18n/provider";
import { LANGUAGE_TAGS } from "@/i18n/config";
import { getRequestLocale, getServerTranslator } from "@/i18n/server";
import { SmoothScrollProvider } from "@/lib/smooth-scroll-provider";
import "lenis/dist/lenis.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = getServerTranslator(locale);

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={LANGUAGE_TAGS[locale]} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AppI18nProvider initialLocale={locale}>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </AppI18nProvider>
      </body>
    </html>
  );
}
