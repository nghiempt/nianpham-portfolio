import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nianpham.my/"),
  title: "Nian Pham Portfolio",
  description:
    "Senior Fullstack AI Engineer with proven experience building production-grade AI systems, from Knowledge Graphs and Multi-Agent platforms to Voice AI and enterprise applications. Passionate about turning cutting-edge AI research into scalable, real-world products that deliver measurable business impact.",
  openGraph: {
    title: "Nian Pham Portfolio",
    description:
      "Senior Fullstack AI Engineer with proven experience building production-grade AI systems, from Knowledge Graphs and Multi-Agent platforms to Voice AI and enterprise applications. Passionate about turning cutting-edge AI research into scalable, real-world products that deliver measurable business impact.",
    url: "https://www.nianpham.my/",
    siteName: "Nian Pham Portfolio",
    images: [
      {
        url: "https://the-brandidentity.com/uploads/products/fractal-glass-gradients/Fractal-Glass-Gradients-1.jpg",
        width: 1200,
        height: 630,
        alt: "Nian Pham Portfolio",
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
