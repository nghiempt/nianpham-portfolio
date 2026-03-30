import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nianpham.my"),
  title: "Nian Pham",
  description:
    "AI Engineer with expertise in LLM systems, multi-agent architectures, and multimodal AI, backed by ~4 years of experience and 20+ publications. Lead AI teams and delivered production-grade solutions for enterprise clients in finance, healthcare, and media.",
  openGraph: {
    title: "Nian Pham",
    description:
      "AI Engineer with expertise in LLM systems, multi-agent architectures, and multimodal AI, backed by ~4 years of experience and 20+ publications. Lead AI teams and delivered production-grade solutions for enterprise clients in finance, healthcare, and media.",
    url: "https://nianpham.my/",
    siteName: "Nian Pham",
    images: [
      {
        url: "https://res.cloudinary.com/farmcode/image/upload/v1774857166/other/mp0r44ovdvs6ktymud3a.png",
        width: 1200,
        height: 630,
        alt: "Nian Pham",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Manrope:wght@200;400;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background font-body text-on-surface selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
