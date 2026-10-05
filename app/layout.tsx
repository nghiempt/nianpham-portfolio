import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nianpham.my/"),
  title: "Nian Pham Portfolio",
  description:
    "The shortest path from impossible to production runs through my code",
  openGraph: {
    title: "Nian Pham Portfolio",
    description:
      "The shortest path from impossible to production runs through my code",
    url: "https://www.nianpham.my/",
    siteName: "Nian Pham Portfolio",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nian Pham Portfolio",
    description:
      "The shortest path from impossible to production runs through my code",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
