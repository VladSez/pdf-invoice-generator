import { Text, View } from "@react-pdf/renderer";
import { styles } from ".";
import { type InvoiceData } from "@/app/schema";
import { translations } from "./translations";

export function InvoiceHeader({ invoiceData }: { invoiceData: InvoiceData }) {
  const language = invoiceData.language;
  const t = translations[language];

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 7,
      }}
    >
      <View>
        <Text style={[styles.header]}>
          {t.invoiceNumber}: {invoiceData?.invoiceNumber}
        </Text>

        {invoiceData?.invoiceType && (
          <Text style={[styles.fontBold, styles.fontSize8]}>
            {invoiceData?.invoiceType}
          </Text>
        )}
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <Text style={styles.fontSize7}>
          {t.dateOfIssue}:{" "}
          <Text style={[styles.fontBold, styles.fontSize8]}>
            {invoiceData?.dateOfIssue}
          </Text>
        </Text>
        <Text style={styles.fontSize7}>
          {t.dateOfService}:{" "}
          <Text style={[styles.fontBold, styles.fontSize8]}>
            {invoiceData?.dateOfService}
          </Text>
        </Text>
      </View>
    </View>
  );
}
