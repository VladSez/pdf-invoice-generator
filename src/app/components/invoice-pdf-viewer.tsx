import { PDFViewer } from "@react-pdf/renderer";

export function InvoicePDFViewer({ children }: { children: React.ReactNode }) {
  return (
    <PDFViewer
      width="100%"
      height="650px"
      className="mb-4 h-[600px] lg:h-[650px]"
    >
      {/* @ts-expect-error PR with fix?: https://github.com/diegomura/react-pdf/pull/2888 */}
      {children}
    </PDFViewer>
  );
}
