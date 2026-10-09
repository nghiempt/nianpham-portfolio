import type { Metadata, Viewport } from "next";
import { Hammersmith_One, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import Analytics from "./analytics";
import Intro from "./intro";
import { OWNER, SITE_URL } from "./profiles";
import { DESCRIPTIONS } from "./seo";

// Body and UI text.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

// Display face, used only for the name on the About window.
const display = Hammersmith_One({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${OWNER.name} (${OWNER.nickname}) — Senior AI Engineer & Researcher`,
    template: `%s | ${OWNER.name}`,
  },
  description: DESCRIPTIONS.about,
  applicationName: OWNER.name,
  authors: [{ name: OWNER.name, url: `${SITE_URL}/` }],
  creator: OWNER.name,
  publisher: OWNER.name,
  keywords: [
    OWNER.name,
    OWNER.nickname,
    OWNER.nativeName,
    "Nghiem Pham",
    "AI Engineer",
    "Scientific Researcher",
    "LLM",
    "Agentic AI",
    "Portfolio",
    "Ho Chi Minh City",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Search Console's "HTML tag" method; set the token in the hosting env.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    siteName: OWNER.name,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${display.variable} intro-on`}>
      <body>
        <Intro />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
