import type { Metadata, Viewport } from "next";
import { Hammersmith_One, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import Intro from "./intro";

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
  metadataBase: new URL("https://www.nianpham.my/"),
  title: "Nghiem Thanh Pham",
  description:
    "The shortest path from impossible to production goes through my code",
  openGraph: {
    title: "Nghiem Thanh Pham",
    description:
      "The shortest path from impossible to production goes through my code",
    url: "https://www.nianpham.my/",
    siteName: "Nghiem Thanh Pham",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nghiem Thanh Pham",
    description:
      "The shortest path from impossible to production goes through my code",
  },
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
      </body>
    </html>
  );
}
