"use client";

import { type InvoiceData } from "@/app/schema";
import {
  Document,
  Font,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { InvoiceHeader } from "./invoice-header";
import { InvoiceSellerBuyerInfo } from "./invoice-seller-buyer-info";
import { InvoiceItemsTable } from "./invoice-items-table";
import { InvoicePaymentInfo } from "./invoice-payment-info";
import { InvoiceVATSummaryTable } from "./invoice-vat-summary-table";
import { InvoicePaymentTotals } from "./invoice-payment-totals";
import { translations } from "./translations";

const PROD_WEBSITE_URL = "https://pdf-invoice-generator-one.vercel.app";

// Open sans seems to be working fine with EN and PL
const fontFamily = "Open Sans";
const fontFamilyBold = "Open Sans";

Font.register({
  family: fontFamily,
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf",
      fontWeight: 700,
    },
  ],
});

// Styles for the PDF
export const styles = StyleSheet.create({
  wFull: {
    width: "100%",
  },
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: fontFamily,
    fontWeight: 400,
  },
  header: {
    fontSize: 16,
    marginBottom: 0,
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  subheader: {
    fontSize: 12,
    marginBottom: 3,
    borderBottom: "1px solid gray",
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  fontSize7: {
    fontSize: 7,
  },
  fontSize8: {
    fontSize: 8,
  },
  fontSize9: {
    fontSize: 9,
  },
  fontSize10: {
    fontSize: 10,
  },
  fontSize11: {
    fontSize: 11,
  },
  fontBold: {
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  boldText: {
    fontFamily: fontFamilyBold,
    fontWeight: 600,
    fontSize: 7,
  },
  table: {
    display: "flex",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "gray",
  },
  tableRow: {
    flexDirection: "row",
    width: "100%",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "gray",
    textAlign: "center",
  },
  tableCell: {
    marginTop: 1.5,
    marginBottom: 1.5,
    fontSize: 8,
  },
  tableCellBold: {
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 2,
    marginRight: 2,
    fontSize: 8,
    fontFamily: fontFamilyBold,
    fontWeight: 600,
  },
  // styles for specific column widths for invoice items table
  colNo: { width: "3%" },
  colName: { width: "36%" },
  colGTU: { width: "6%" },
  colAmount: { width: "7%" },
  colUnit: { width: "6%" },
  colNetPrice: { width: "10%" },
  colVAT: { width: "4%" },
  colNetAmount: { width: "10%" },
  colVATAmount: { width: "8%" },
  colPreTaxAmount: { width: "10%" },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 70,
    width: "100%",
  },
  signatureColumn: {
    flexDirection: "column",
    alignItems: "center",
    width: "30%",
    marginHorizontal: "5%",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "dashed",
    width: "100%",
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: "1px solid #000",
    paddingTop: 5,
  },
  footerText: {
    fontSize: 8,
    color: "#000",
  },
} as const);

// PDF Document component
export const InvoicePdfTemplate = ({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) => {
  const formattedInvoiceTotal = invoiceData?.total
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replaceAll(",", " ");

  const language = invoiceData.language;
  const t = translations[language];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <InvoiceHeader invoiceData={invoiceData} />
        <InvoiceSellerBuyerInfo invoiceData={invoiceData} />
        <InvoiceItemsTable
          invoiceData={invoiceData}
          formattedInvoiceTotal={formattedInvoiceTotal}
        />

        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <InvoicePaymentInfo invoiceData={invoiceData} />
          <InvoiceVATSummaryTable
            invoiceData={invoiceData}
            formattedInvoiceTotal={formattedInvoiceTotal}
          />
        </View>

        <InvoicePaymentTotals
          invoiceData={invoiceData}
          formattedInvoiceTotal={formattedInvoiceTotal}
        />

        {/* Signature section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureColumn}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>
              {t.personAuthorizedToReceive}
            </Text>
          </View>
          <View style={styles.signatureColumn}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>
              {t.personAuthorizedToIssue}
            </Text>
          </View>
        </View>

        {/* Notes */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.fontSize8}>{invoiceData?.notes}</Text>
        </View>

        {/* Footer  */}
        <View style={styles.footer}>
          <Text style={[styles.fontSize7]}>
            Created with{" "}
            <Link
              style={[styles.fontSize7, { color: "black" }]}
              src={PROD_WEBSITE_URL}
            >
              {PROD_WEBSITE_URL}
            </Link>
          </Text>
          {/* Page number */}
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};
