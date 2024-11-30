"use client";

import {
  invoiceSchema,
  SUPPORTED_LANGUAGES,
  type InvoiceData,
} from "@/app/schema";
import { startTransition, useEffect } from "react";
import {
  InvoiceForm,
  PDF_DATA_LOCAL_STORAGE_KEY,
} from "./components/invoice-form";
import { SUPPORTED_CURRENCIES } from "@/app/schema";
import dayjs from "dayjs";
import { useQueryState } from "nuqs";
import dynamic from "next/dynamic";
import { InvoicePdfTemplate } from "./components/invoice-pdf-template";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

const InvoicePDFDownloadLink = dynamic(
  () =>
    import("./components/invoice-pdf-download-link").then(
      (mod) => mod.InvoicePDFDownloadLink
    ),

  {
    ssr: false,
    loading: () => (
      <div className="mb-4 lg:mb-0 w-full lg:w-[180px] text-center px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
        Loading document...
      </div>
    ),
  }
);

const InvoicePDFViewer = dynamic(
  () =>
    import("./components/invoice-pdf-viewer").then(
      (mod) => mod.InvoicePDFViewer
    ),

  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-200 border border-gray-200">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
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

const initialInvoiceData = {
  language: EN,
  currency: EUR,
  invoiceNumber: `1/${invoiceCurrentMonthAndYear}`,
  dateOfIssue: today,
  dateOfService: lastDayOfMonth,
  invoiceType: "Reverse Charge",
  seller: {
    name: "Seller name",
    address: "Seller address",
    vatNo: "Seller vat number",
    email: "seller@email.com",
    accountNumber: "Seller account number",
    swiftBic: "Seller swift bic",
  },
  buyer: {
    name: "Buyer name",
    address: "Buyer address",
    vatNo: "Buyer vat number",
    email: "buyer@email.com",
  },
  items: [
    {
      name: "Item name",
      amount: 1,
      unit: "service",
      netPrice: 0,
      vat: "NP",
      netAmount: 0,
      vatAmount: 0.0,
      preTaxAmount: 0,
    },
  ],
  total: 0,
  paymentMethod: "wire transfer",
  paymentDue: paymentDue,
  notes: "Reverse charge",
} as const satisfies InvoiceData;

export default function Home() {
  const [invoiceDataParam, setInvoiceDataParam] = useQueryState("data", {
    parse: (value: string) => {
      try {
        // Decompress the URL parameter before parsing
        const decompressed = decompressFromEncodedURIComponent(value);

        const parsed = JSON.parse(decompressed);
        const validated = invoiceSchema.parse(parsed);

        return validated;
      } catch {
        return null;
      }
    },
    serialize: (value: InvoiceData | null) => {
      if (!value) return "";

      const stringified = JSON.stringify(value);

      // Compress the data before adding to URL
      const compressed = compressToEncodedURIComponent(stringified);

      return compressed;
    },
    defaultValue: null,
  });

  // Initialize data from localStorage only if URL param is not present
  useEffect(() => {
    if (!invoiceDataParam) {
      try {
        const savedData = localStorage.getItem(PDF_DATA_LOCAL_STORAGE_KEY);
        if (savedData) {
          const parsedData = invoiceSchema.parse(JSON.parse(savedData));
          setInvoiceDataParam(parsedData);
        } else {
          setInvoiceDataParam(initialInvoiceData);
        }
      } catch (error) {
        console.error("Failed to load saved invoice data:", error);
        alert("Failed to load saved invoice data");
        setInvoiceDataParam(initialInvoiceData);
      }
    }
  }, [invoiceDataParam, setInvoiceDataParam]); // Only run on mount

  // Sync URL data to localStorage whenever URL params change
  useEffect(() => {
    if (invoiceDataParam) {
      try {
        localStorage.setItem(
          PDF_DATA_LOCAL_STORAGE_KEY,
          JSON.stringify(invoiceDataParam)
        );
      } catch (error) {
        console.error("Failed to save invoice data:", error);
        alert("Failed to save invoice data");
      }
    }
  }, [invoiceDataParam]);

  const handleInvoiceDataChange = (updatedData: InvoiceData) => {
    startTransition(() => {
      setInvoiceDataParam(updatedData);
    });
  };

  if (!invoiceDataParam) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-7xl">
        <div className="flex flex-row flex-wrap lg:flex-nowrap items-center justify-between w-full">
          <h1 className="text-2xl font-bold mb-4 w-full text-center lg:text-left">
            Free Invoice PDF Generator • Open Source
          </h1>

          <div className="w-full flex justify-center flex-wrap lg:flex-nowrap lg:justify-end gap-3 mb-1">
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(window.location.href)
                  .then(() => {
                    alert("URL copied to clipboard!");
                  })
                  .catch((err) => {
                    console.error("Failed to copy URL:", err);
                    alert("Failed to copy URL to clipboard");
                  });
              }}
              className="inline-flex w-full lg:w-auto justify-center items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
            >
              Copy link to invoice
            </button>
            <InvoicePDFDownloadLink invoiceData={invoiceDataParam} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <div className="h-[400px] lg:h-[600px] overflow-auto p-3">
              <InvoiceForm
                invoiceData={invoiceDataParam}
                onInvoiceDataChange={handleInvoiceDataChange}
              />
            </div>
            <div className="flex justify-center mt-4">
              <a
                href="https://github.com/VladSez/pdf-invoice-generator"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <GithubIcon />
              </a>
            </div>
          </div>
          <div className="lg:col-span-8 h-[600px] lg:h-[630px] w-full max-w-full">
            <InvoicePDFViewer>
              <InvoicePdfTemplate invoiceData={invoiceDataParam} />
            </InvoicePDFViewer>
          </div>
        </div>
      </div>
    </div>
  );
}

const GithubIcon = () => {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
    >
      <title>View on GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
};
