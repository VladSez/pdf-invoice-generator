import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Loglib from "@loglib/tracker/react";

import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Free PDF Invoice Generator with Live Preview",
  description:
    "Generate professional PDF invoices instantly with Live Preview. Free and open-source. No signup required.",
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
      "Generate professional PDF invoices instantly with Live Preview. Free and open-source. No signup required.",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free PDF Invoice Generator with Live Preview",
    description:
      "Generate professional PDF invoices instantly with Live Preview. Free and open-source. No signup required.",
    creator: "@vlad_sazon",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
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
        {/* https://sonner.emilkowal.ski/ */}
        <Toaster visibleToasts={1} richColors />
      </body>
    </html>
  );
}
