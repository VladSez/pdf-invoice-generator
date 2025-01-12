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
      className="mb-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-slate-50 shadow-sm shadow-black/5 outline-offset-2 hover:bg-slate-900/90 focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 lg:mb-0 lg:w-[180px]"
      onClick={() => {
        loglib.track("download_invoice");
      }}
    >
      {/* @ts-expect-error PR with fix: https://github.com/diegomura/react-pdf/pull/2888 */}
      {({ loading }) => (loading ? "Loading document..." : "Download PDF")}
    </PDFDownloadLink>
  );
}
