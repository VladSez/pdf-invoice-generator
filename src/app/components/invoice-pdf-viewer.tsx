import { PDFViewer } from "@react-pdf/renderer";

export function InvoicePDFViewer({ children }: { children: React.ReactNode }) {
  return (
    <PDFViewer
      width="100%"
      className="mb-4 h-[580px] w-full lg:h-[620px]"
      title="Invoice PDF Viewer"
    >
      {/* @ts-expect-error PR with fix?: https://github.com/diegomura/react-pdf/pull/2888 */}
      {children}
    </PDFViewer>
  );
}
