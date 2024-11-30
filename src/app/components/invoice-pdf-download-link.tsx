import { PDFDownloadLink } from "@react-pdf/renderer";
import type { InvoiceData } from "@/app/schema";
import dayjs from "dayjs";
import { InvoicePdfTemplate } from "./invoice-pdf-template";
import { loglib } from "@loglib/tracker";

export function InvoicePDFDownloadLink({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const invoiceDate = dayjs().format("DD-MM-YYYY");

  return (
    <PDFDownloadLink
      document={<InvoicePdfTemplate invoiceData={invoiceData} />}
      fileName={`invoice-${invoiceDate}.pdf`}
      className="mb-4 lg:mb-0 w-full lg:w-[180px] text-center px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      onClick={() => {
        loglib.track("download_invoice");
      }}
    >
      {/* @ts-expect-error PR with fix: https://github.com/diegomura/react-pdf/pull/2888 */}
      {({ loading }) => (loading ? "Loading document..." : "Download PDF")}
    </PDFDownloadLink>
  );
}
