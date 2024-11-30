import { PDFViewer } from "@react-pdf/renderer";

export function InvoicePDFViewer({ children }: { children: React.ReactNode }) {
  return (
    <PDFViewer
      width="100%"
      className="mb-4 h-[600px] lg:h-[650px] w-full"
      title="Invoice PDF Viewer"
    >
      {/* @ts-expect-error PR with fix?: https://github.com/diegomura/react-pdf/pull/2888 */}
      {children}
    </PDFViewer>
  );
}
