import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Loglib from "@loglib/tracker/react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Free PDF Invoice Generator",
  description:
    "Generate professional PDF invoices for free. Supports multiple languages, currencies, and customizable templates. Perfect for freelancers and small businesses.",
  keywords:
    "invoice generator, pdf invoice, free invoice generator, business invoice, invoice template, open source, free, pdf, invoice, generator, business, freelancer",
  authors: [{ name: "Uladzislau Sazonau" }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
  metadataBase: new URL("https://pdf-invoice-generator-one.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Free PDF Invoice Generator",
    description:
      "Generate professional PDF invoices for free. Supports multiple languages, currencies, and customizable templates.",
    url: "https://pdf-invoice-generator-one.vercel.app",
    siteName: "PDF Invoice Generator",
    locale: "en_US",
    type: "website",
    // images: [
    //   {
    //     url: "/og-image.png",
    //     width: 1200,
    //     height: 630,
    //     alt: "PDF Invoice Generator Preview",
    //   },
    // ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free PDF Invoice Generator",
    description:
      "Generate professional PDF invoices for free. Supports multiple languages, currencies, and customizable templates.",
    // images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Loglib
          config={{
            id: "pdf-invoice-editor",
          }}
        />
      </body>
    </html>
  );
}
