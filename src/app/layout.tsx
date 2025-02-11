import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Loglib from "@loglib/tracker/react";

import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Free PDF Invoice Generator with Live Preview",
  description:
    "Generate professional PDF invoices instantly with Live Preview. Free and open-source. No signup required. Supports multiple languages and currencies. Ideal for freelancers and small businesses.",
  keywords:
    "invoice generator, pdf invoice generator, free invoice maker, business invoice template, professional invoice, digital invoice, online invoice generator, invoice software, small business invoice, freelancer invoice, tax invoice, electronic invoice, invoice creation tool, billing software, accounting tools,",
  authors: [{ name: "Uladzislau Sazonau" }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
  metadataBase: new URL("https://easyinvoicepdf.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Free PDF Invoice Generator with Live Preview",
    description:
      "Generate professional PDF invoices instantly with Live Preview. Free and open-source. No signup required. Supports multiple languages and currencies. Ideal for freelancers and small businesses.",
    url: "https://easyinvoicepdf.com",
    siteName: "Free PDF Invoice Generator with Live Preview",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free PDF Invoice Generator with Live Preview",
    description:
      "Generate professional PDF invoices instantly with Live Preview. Free and open-source. No signup required. Supports multiple languages and currencies. Ideal for freelancers and small businesses.",
    creator: "@vlad_sazon",
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
            webVitals: true,
          }}
        />
        <Toaster />
      </body>
    </html>
  );
}
