"use client";

import { useEffect, useState } from "react";
import { usePDF } from "@react-pdf/renderer";
import type { InvoiceData } from "@/app/schema";
import { InvoicePdfTemplate } from "./invoice-pdf-template";
import { loglib } from "@loglib/tracker";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { LOADING_BUTTON_TEXT, LOADING_TIMEOUT } from "./invoice-form";

export function InvoicePDFDownloadLink({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const filename = `invoice-${
    invoiceData.language
  }-${invoiceData.invoiceNumber.replace("/", "-")}.pdf`;

  const [{ loading: pdfLoading, url }] = usePDF({
    document: <InvoicePdfTemplate invoiceData={invoiceData} />,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pdfLoading) {
      setIsLoading(true);
    } else {
      // wait for 0.5 second before hiding the loader
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, LOADING_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [pdfLoading]);

  return (
    <>
      <a
        href={url || "#"}
        download={filename}
        onClick={() => {
          if (!isLoading && url) {
            loglib.track("download_invoice");
          }
        }}
        className={cn(
          "mb-4 h-[36px] w-full rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-slate-50 shadow-sm shadow-black/5 outline-offset-2 hover:bg-slate-900/90 focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 lg:mb-0 lg:w-[210px]",
          {
            "pointer-events-none opacity-70": isLoading,
          }
        )}
      >
        {isLoading ? (
          <span className="inline-flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="animate-pulse">{LOADING_BUTTON_TEXT}</span>
          </span>
        ) : (
          "Download PDF"
        )}
      </a>
    </>
  );
}
