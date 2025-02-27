"use client";

import { Button } from "@/components/ui/button";
import { CustomTooltip } from "@/components/ui/tooltip";
import {
  LOADING_BUTTON_TEXT,
  LOADING_BUTTON_TIMEOUT,
  PDF_DATA_FORM_ID,
} from "./invoice-form";
import { InvoicePdfTemplate } from "./invoice-pdf-template";
import { usePDF } from "@react-pdf/renderer";
import type { InvoiceData } from "../schema";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { useOpenPanel } from "@openpanel/nextjs";

export function RegenerateInvoiceButton({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const [{ loading: pdfLoading, error }] = usePDF({
    document: <InvoicePdfTemplate invoiceData={invoiceData} />,
  });
  const [isLoading, setIsLoading] = useState(false);
  const openPanel = useOpenPanel();

  useEffect(() => {
    if (pdfLoading) {
      setIsLoading(true);
    } else {
      // When PDF loading completes, wait for 0.5 second before hiding the loader
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, LOADING_BUTTON_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [pdfLoading]);

  useEffect(() => {
    if (error) {
      toast.error("Error generating document link");
    }
  }, [error]);

  return (
    <CustomTooltip
      trigger={
        <Button
          type="submit"
          form={PDF_DATA_FORM_ID}
          _variant="outline"
          className="mt-2 w-full"
          disabled={isLoading}
          onClick={() => {
            // analytics events
            openPanel.track("regenerate_invoice");
            umamiTrackEvent("regenerate_invoice");
          }}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="animate-pulse">{LOADING_BUTTON_TEXT}</span>
            </span>
          ) : (
            "Regenerate Invoice"
          )}
        </Button>
      }
      content={isLoading ? null : "Click to regenerate the invoice PDF preview"}
    />
  );
}
