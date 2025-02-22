import { Text, View } from "@react-pdf/renderer";
import { styles } from ".";
import type { InvoiceData } from "@/app/schema";
import { translations } from "./translations";

export function InvoiceVATSummaryTable({
  invoiceData,
  formattedInvoiceTotal,
}: {
  invoiceData: InvoiceData;
  formattedInvoiceTotal: string;
}) {
  const language = invoiceData.language;
  const t = translations[language];

  const sortedItems = [...invoiceData?.items].sort((a, b) => {
    // Handle cases where either value is a string (NP or OO)
    const isAString = isNaN(Number(a.vat));
    const isBString = isNaN(Number(b.vat));

    if (isAString && isBString) {
      if (typeof a.vat === "string" && typeof b.vat === "string") {
        return a.vat.localeCompare(b.vat);
      }
    }

    if (isAString) return 1; // Strings go last
    if (isBString) return -1; // Strings go last

    // Both are numbers, sort descending
    return Number(b.vat) - Number(a.vat);
  });

  const totalNetAmount = sortedItems.reduce(
    (acc, item) => acc + item.netAmount,
    0
  );
  const formattedTotalNetAmount = totalNetAmount
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replaceAll(",", " ");

  const totalVATAmount = sortedItems.reduce(
    (acc, item) => acc + item.vatAmount,
    0
  );
  const formattedTotalVATAmount = totalVATAmount
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replaceAll(",", " ");

  return (
    <View style={[styles.table, { width: "100%" }]}>
      {/* Header row */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{t.vatSummaryTable.vatRate}</Text>
        </View>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{t.vatSummaryTable.net}</Text>
        </View>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{t.vatSummaryTable.vat}</Text>
        </View>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text style={styles.tableCellBold}>{t.vatSummaryTable.preTax}</Text>
        </View>
      </View>

      {sortedItems?.map((item, index) => {
        const formattedNetAmount = item.netAmount
          .toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          .replaceAll(",", " ");

        const formattedPreTaxAmount = item.preTaxAmount
          .toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          .replaceAll(",", " ");

        return (
          <View style={styles.tableRow} key={index}>
            {/* VAT rate */}
            <View style={[styles.tableCol, { width: "25%" }]}>
              <Text
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              >
                {isNaN(Number(item.vat)) ? item.vat : `${item.vat}%`}
              </Text>
            </View>
            {/* Net */}
            <View style={[styles.tableCol, { width: "25%" }]}>
              <Text
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              >
                {formattedNetAmount}
              </Text>
            </View>
            {/* VAT */}
            <View style={[styles.tableCol, { width: "25%" }]}>
              <Text
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              >
                {typeof item.vatAmount === "number"
                  ? item.vatAmount.toFixed(2)
                  : "0.00"}
              </Text>
            </View>
            {/* Pre-tax */}
            <View style={[styles.tableCol, { width: "25%" }]}>
              <Text
                style={[
                  styles.tableCell,
                  { textAlign: "right", marginRight: 2 },
                ]}
              >
                {formattedPreTaxAmount}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Total row */}
      <View style={styles.tableRow}>
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          >
            {t.vatSummaryTable.total}
          </Text>
        </View>
        {/* Net */}
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          >
            {formattedTotalNetAmount}
          </Text>
        </View>
        {/* VAT */}
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          >
            {formattedTotalVATAmount}
          </Text>
        </View>
        {/* Pre-tax */}
        <View style={[styles.tableCol, { width: "25%" }]}>
          <Text
            style={[styles.tableCell, { textAlign: "right", marginRight: 2 }]}
          >
            {formattedInvoiceTotal}
          </Text>
        </View>
      </View>
    </View>
  );
}
