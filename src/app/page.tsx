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
      <div className="mb-4 lg:mb-0 w-full lg:w-[180px] text-center px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
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
    loading: () => <div className="">Loading pdf viewer...</div>,
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
            Free PDF Invoice Generator
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
          </div>
          <div className="lg:col-span-8 h-[600px] lg:h-[630px]">
            <InvoicePDFViewer>
              <InvoicePdfTemplate invoiceData={invoiceDataParam} />
            </InvoicePDFViewer>
          </div>
        </div>
      </div>
    </div>
  );
}
