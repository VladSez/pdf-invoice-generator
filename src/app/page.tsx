"use client";

import { invoiceSchema, type InvoiceData } from "@/app/schema";
import { Button } from "@/components/ui/button";
import { CustomTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  InvoiceForm,
  PDF_DATA_LOCAL_STORAGE_KEY,
} from "./components/invoice-form";
import { InvoicePDFDownloadLink } from "./components/invoice-pdf-download-link";
import { InvoicePdfTemplate } from "./components/invoice-pdf-template";
import { RegenerateInvoiceButton } from "./components/regenerate-invoice-button";
import { INITIAL_INVOICE_DATA } from "./constants";
import { useOpenPanel } from "@openpanel/nextjs";
import { isLocalStorageAvailable } from "@/lib/check-local-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileTextIcon, PencilIcon } from "lucide-react";

const InvoicePDFViewer = dynamic(
  () =>
    import("./components/invoice-pdf-viewer").then(
      (mod) => mod.InvoicePDFViewer
    ),

  {
    ssr: false,
    loading: () => (
      <div className="flex h-[580px] w-full items-center justify-center border border-gray-200 bg-gray-200 lg:h-[620px]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-600">Loading PDF viewer...</p>
        </div>
      </div>
    ),
  }
);

const TABS_VALUES = ["form", "preview"] as const;

const TAB_FORM = TABS_VALUES[0];
const TAB_PREVIEW = TABS_VALUES[1];

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const openPanel = useOpenPanel();

  const [invoiceDataState, setInvoiceDataState] = useState<InvoiceData | null>(
    null
  );

  // Initialize data from URL or localStorage on mount
  useEffect(() => {
    const compressedInvoiceDataInUrl = searchParams.get("data");

    // first try to load from url
    if (compressedInvoiceDataInUrl) {
      try {
        const decompressed = decompressFromEncodedURIComponent(
          compressedInvoiceDataInUrl
        );
        const parsed = JSON.parse(decompressed);
        const validated = invoiceSchema.parse(parsed);

        setInvoiceDataState(validated);
      } catch (error) {
        // fallback to local storage
        console.error("Failed to parse URL data:", error);
        loadFromLocalStorage();
      }
    } else {
      // if no data in url, load from local storage
      loadFromLocalStorage();
    }
  }, [searchParams]);

  // Helper function to load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(PDF_DATA_LOCAL_STORAGE_KEY);
      if (savedData) {
        const json = JSON.parse(savedData);
        const parsedData = invoiceSchema.parse(json);

        setInvoiceDataState(parsedData);
      } else {
        // if no data in local storage, set initial data
        setInvoiceDataState(INITIAL_INVOICE_DATA);
      }
    } catch (error) {
      console.error("Failed to load saved invoice data:", error);

      setInvoiceDataState(INITIAL_INVOICE_DATA);
    }
  };

  // Save to localStorage whenever data changes on form update
  useEffect(() => {
    // Only save to localStorage if it's available
    if (invoiceDataState && isLocalStorageAvailable) {
      try {
        const newInvoiceDataValidated = invoiceSchema.parse(invoiceDataState);

        localStorage.setItem(
          PDF_DATA_LOCAL_STORAGE_KEY,
          JSON.stringify(newInvoiceDataValidated)
        );

        // Check if URL has data and current data is different
        const urlData = searchParams.get("data");

        if (urlData) {
          try {
            const decompressed = decompressFromEncodedURIComponent(urlData);
            const urlParsed = JSON.parse(decompressed);

            const urlValidated = invoiceSchema.parse(urlParsed);

            if (
              JSON.stringify(urlValidated) !==
              JSON.stringify(newInvoiceDataValidated)
            ) {
              toast.info(
                <p className="text-pretty text-sm leading-relaxed">
                  <span className="font-semibold text-blue-600">
                    Invoice Updated:
                  </span>{" "}
                  Your changes have modified this invoice from its shared
                  version. Click{" "}
                  <span className="font-semibold underline">
                    &apos;Generate a link to invoice&apos;
                  </span>{" "}
                  to create an updated shareable link.
                </p>,
                {
                  duration: 10000,
                  closeButton: true,
                  richColors: true,
                }
              );

              // Clean URL if data differs
              router.replace("/");
            }
          } catch (error) {
            console.error("Failed to compare with URL data:", error);
          }
        }
      } catch (error) {
        console.error("Failed to save invoice data:", error);
        toast.error("Failed to save invoice data");
      }
    }
  }, [invoiceDataState, router, searchParams]);

  const handleInvoiceDataChange = (updatedData: InvoiceData) => {
    setInvoiceDataState(updatedData);
  };

  const handleShareInvoice = async () => {
    if (invoiceDataState) {
      try {
        const newInvoiceDataValidated = invoiceSchema.parse(invoiceDataState);
        const stringified = JSON.stringify(newInvoiceDataValidated);
        const compressed = compressToEncodedURIComponent(stringified);

        // Use push instead of replace to maintain history
        router.push(`/?data=${compressed}`);

        const newFullUrl = `${window.location.origin}/?data=${compressed}`;
        await navigator.clipboard.writeText(newFullUrl);

        toast.success("Invoice link copied to clipboard!", {
          description:
            "Share this link to let others view and edit this invoice",
        });

        // analytics track event
        openPanel.track("share_invoice_link");
        umamiTrackEvent("share_invoice_link");
      } catch (error) {
        console.error("Failed to share invoice:", error);
        toast.error("Failed to generate shareable link");
      }
    }
  };

  // we only want to render the page on client side
  if (!invoiceDataState) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 sm:p-4">
        <div className="mb-4 w-full max-w-7xl bg-white p-3 shadow-lg sm:mb-0 sm:rounded-lg sm:p-6">
          <div className="flex w-full flex-row flex-wrap items-center justify-between lg:flex-nowrap">
            <h1 className="mb-6 mt-6 w-full text-balance text-center text-xl font-bold sm:mb-4 sm:mt-0 sm:text-2xl lg:text-left">
              Free Invoice PDF Generator with Live Preview
            </h1>

            <div className="mb-1 flex w-full flex-wrap justify-center gap-3 lg:flex-nowrap lg:justify-end">
              <Button
                className="w-full bg-blue-500 text-white transition-all hover:scale-105 hover:bg-blue-600 hover:no-underline lg:w-auto"
                _variant="link"
                onClick={() => {
                  window.open(
                    "https://dub.sh/easyinvoice-donate",
                    "_blank",
                    "noopener noreferrer"
                  );

                  // analytics track event
                  openPanel.track("donate_to_project_button_clicked_header");
                  umamiTrackEvent("donate_to_project_button_clicked_header");
                }}
              >
                <span className="flex items-center space-x-1.5">
                  <span className="animate-heartbeat">❤️</span>
                  <span>Support Project</span>
                </span>
              </Button>
              <CustomTooltip
                trigger={
                  <Button
                    onClick={handleShareInvoice}
                    _variant="outline"
                    className="w-full lg:w-auto"
                  >
                    Generate a link to invoice
                  </Button>
                }
                content="Generate a shareable link to this invoice. Share it with your clients to allow them to view the invoice online."
              />
              {isDesktop ? (
                <InvoicePDFDownloadLink invoiceData={invoiceDataState} />
              ) : null}
            </div>
          </div>
          <div className="mb-4 flex flex-row items-center justify-center lg:mb-0 lg:justify-start">
            <span className="relative bottom-0 text-center text-sm text-gray-900 lg:bottom-3">
              Made by{" "}
              <a
                href="https://dub.sh/vldzn.me"
                className="underline transition-colors hover:text-blue-600"
                target="_blank"
              >
                Vlad Sazonau
              </a>
              {" | "}
              <a
                href="https://github.com/VladSez/pdf-invoice-generator"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2"
                title="View on GitHub"
              >
                <span className="transition-all group-hover:text-blue-600 group-hover:underline">
                  Open Source
                </span>
                <GithubIcon />
              </a>
              {" | "}
              <a
                href="https://dub.sh/easy-invoice-pdf-feedback"
                className="transition-colors hover:text-blue-600 hover:underline"
                target="_blank"
              >
                Share your feedback
              </a>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Mobile View with Tabs */}
            <div className="block w-full lg:hidden">
              <Tabs defaultValue={TAB_FORM} className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value={TAB_FORM} className="flex-1">
                    <span className="flex items-center gap-1">
                      <PencilIcon className="h-4 w-4" />
                      Edit Invoice
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value={TAB_PREVIEW} className="flex-1">
                    <span className="flex items-center gap-1">
                      <FileTextIcon className="h-4 w-4" />
                      Preview PDF
                    </span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={TAB_FORM} className="mt-4">
                  <div className="h-[400px] overflow-auto">
                    <InvoiceForm
                      invoiceData={invoiceDataState}
                      onInvoiceDataChange={handleInvoiceDataChange}
                    />
                  </div>
                </TabsContent>
                <TabsContent value={TAB_PREVIEW} className="mt-4">
                  <div className="h-[580px] w-full">
                    <InvoicePDFViewer>
                      <InvoicePdfTemplate invoiceData={invoiceDataState} />
                    </InvoicePDFViewer>
                  </div>
                </TabsContent>
                {/* Action buttons visible in both tabs */}
                <div className="sticky bottom-0 mt-4 flex flex-col gap-3 bg-white pb-2">
                  <RegenerateInvoiceButton invoiceData={invoiceDataState} />
                  <InvoicePDFDownloadLink invoiceData={invoiceDataState} />
                </div>
              </Tabs>
            </div>

            {/* Desktop View - Side by Side */}
            <div className="hidden lg:col-span-4 lg:block">
              <div className="h-[580px] overflow-auto pl-0">
                <InvoiceForm
                  invoiceData={invoiceDataState}
                  onInvoiceDataChange={handleInvoiceDataChange}
                />
              </div>
              <div className="flex flex-col gap-3">
                <RegenerateInvoiceButton invoiceData={invoiceDataState} />
              </div>
            </div>
            <div className="hidden h-[580px] w-full max-w-full lg:col-span-8 lg:block">
              <InvoicePDFViewer>
                <InvoicePdfTemplate invoiceData={invoiceDataState} />
              </InvoicePDFViewer>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

const GithubIcon = () => {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 transition-all group-hover:fill-blue-600"
    >
      <title>View on GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
};
