import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body selection:bg-blue-600/20">
        {children}
      </body>
    </html>
  );
}
