"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { useState } from "react";

export function InvoicePDFViewer({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex h-[600px] lg:h-[650px] w-full items-center justify-center border border-red-500 bg-red-50 text-red-700">
        <p>
          Failed to load PDF viewer. Please try refreshing the page or try in
          another browser.
        </p>
      </div>
    );
  }

  return (
    <PDFViewer
      width="100%"
      className="mb-4 h-[600px] lg:h-[650px] w-full"
      title="Invoice PDF Viewer"
      onError={() => setHasError(true)}
    >
      {/* @ts-expect-error PR with fix?: https://github.com/diegomura/react-pdf/pull/2888 */}
      {children}
    </PDFViewer>
  );
}
