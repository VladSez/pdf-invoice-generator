"use client";

import {
  DEFAULT_SELLER_DATA,
  invoiceSchema,
  SUPPORTED_CURRENCIES,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_LANGUAGES,
  type InvoiceData,
} from "@/app/schema";
import { Button } from "@/components/ui/button";
import { CustomTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import dayjs from "dayjs";
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

const today = dayjs().format("YYYY-MM-DD");
const lastDayOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
const invoiceCurrentMonthAndYear = dayjs().format("MM-YYYY");
const paymentDue = dayjs(today).add(14, "days").format("YYYY-MM-DD");

const EUR = SUPPORTED_CURRENCIES[0];
const EN = SUPPORTED_LANGUAGES[0];
const DEFAULT_DATE_FORMAT = SUPPORTED_DATE_FORMATS[0];

const initialInvoiceData = {
  language: EN,
  currency: EUR,
  invoiceNumber: `1/${invoiceCurrentMonthAndYear}`,

  dateOfIssue: today,
  dateOfService: lastDayOfMonth,
  dateFormat: DEFAULT_DATE_FORMAT,

  invoiceType: "Reverse Charge",
  invoiceTypeFieldIsVisible: true,

  seller: DEFAULT_SELLER_DATA,
  buyer: {
    name: "Buyer name",
    address: "Buyer address",
    vatNo: "Buyer vat number",
    vatNoFieldIsVisible: true,
    email: "buyer@email.com",
  },
  items: [
    {
      invoiceItemNumberIsVisible: true,

      name: "Item name",
      nameFieldIsVisible: true,

      typeOfGTU: "",
      typeOfGTUFieldIsVisible: true,

      amount: 1,
      amountFieldIsVisible: true,

      unit: "service",
      unitFieldIsVisible: true,

      netPrice: 0,
      netPriceFieldIsVisible: true,

      vat: "NP",
      vatFieldIsVisible: true,

      netAmount: 0,
      netAmountFieldIsVisible: true,

      vatAmount: 0.0,
      vatAmountFieldIsVisible: true,

      preTaxAmount: 0,
      preTaxAmountFieldIsVisible: true,
    },
  ],
  total: 0,
  paymentMethod: "wire transfer",

  paymentDue: paymentDue,

  notes: "Reverse charge",
  notesFieldIsVisible: true,

  vatTableSummaryIsVisible: true,
  paymentMethodFieldIsVisible: true,
  personAuthorizedToReceiveFieldIsVisible: true,
  personAuthorizedToIssueFieldIsVisible: true,
} as const satisfies InvoiceData;

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [invoiceDataState, setInvoiceDataState] = useState<InvoiceData | null>(
    null
  );

  // Initialize data from URL or localStorage on mount
  useEffect(() => {
    const urlData = searchParams.get("data");

    if (urlData) {
      try {
        const decompressed = decompressFromEncodedURIComponent(urlData);
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
        // setInvoiceDataState(restOfInvoiceData);
      } else {
        // if no data in local storage, set initial data
        setInvoiceDataState(initialInvoiceData);
      }
    } catch (error) {
      console.error("Failed to load saved invoice data:", error);

      setInvoiceDataState(initialInvoiceData);
    }
  };

  // Save to localStorage whenever data changes on form update
  useEffect(() => {
    if (invoiceDataState) {
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

        toast.success("URL copied to clipboard!");
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
              Free Invoice PDF Generator with live preview
            </h1>

            <div className="mb-1 flex w-full flex-wrap justify-center gap-3 lg:flex-nowrap lg:justify-end">
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
                content="Share invoice with a link"
              />
              {isDesktop ? (
                <InvoicePDFDownloadLink invoiceData={invoiceDataState} />
              ) : null}
            </div>
          </div>
          <div className="mb-4 flex flex-row items-center justify-center lg:mb-0 lg:justify-start">
            <span className="relative bottom-0 text-sm text-gray-900 lg:bottom-3">
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
                Got feedback?
              </a>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="h-[400px] overflow-auto p-3 lg:h-[580px] lg:pl-0">
                <InvoiceForm
                  invoiceData={invoiceDataState}
                  onInvoiceDataChange={handleInvoiceDataChange}
                />
              </div>

              <div className="flex flex-col gap-3">
                <RegenerateInvoiceButton invoiceData={invoiceDataState} />
                {/* We show the pdf download link here only on mobile/tables */}
                {isDesktop ? null : (
                  <InvoicePDFDownloadLink invoiceData={invoiceDataState} />
                )}
              </div>

              <hr className="my-2 block w-full lg:hidden" />
            </div>
            <div className="h-[580px] w-full max-w-full lg:col-span-8">
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
