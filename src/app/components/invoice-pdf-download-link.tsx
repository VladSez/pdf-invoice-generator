import { PDFDownloadLink } from "@react-pdf/renderer";
import type { InvoiceData } from "@/app/schema";
import { InvoicePdfTemplate } from "./invoice-pdf-template";
import { loglib } from "@loglib/tracker";

export function InvoicePDFDownloadLink({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const filename = `invoice-${
    invoiceData.language
  }-${invoiceData.invoiceNumber.replace("/", "-")}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoicePdfTemplate invoiceData={invoiceData} />}
      fileName={filename}
      className="mb-4 lg:mb-0 w-full lg:w-[180px] text-center px-4 py-2 bg-slate-900 text-slate-50 shadow-sm shadow-black/5 hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 rounded-lg text-sm font-medium outline-offset-2 focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
      onClick={() => {
        loglib.track("download_invoice");
      }}
    >
      {/* @ts-expect-error PR with fix: https://github.com/diegomura/react-pdf/pull/2888 */}
      {({ loading }) => (loading ? "Loading document..." : "Download PDF")}
    </PDFDownloadLink>
  );
}
