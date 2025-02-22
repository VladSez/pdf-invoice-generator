import { Text, View } from "@react-pdf/renderer";
import { styles } from ".";
import { type InvoiceData } from "@/app/schema";
import { translations } from "./translations";
import dayjs from "dayjs";

export function InvoiceHeader({ invoiceData }: { invoiceData: InvoiceData }) {
  const language = invoiceData.language;
  const t = translations[language];

  const dateOfIssue = dayjs(invoiceData.dateOfIssue).format(
    invoiceData.dateFormat
  );
  const dateOfService = dayjs(invoiceData.dateOfService).format(
    invoiceData.dateFormat
  );

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

        {invoiceData?.invoiceType && invoiceData.invoiceTypeFieldIsVisible && (
          <Text
            style={[styles.fontBold, styles.fontSize8, { maxWidth: "250px" }]}
          >
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
          <Text style={[styles.fontBold, styles.fontSize8]}>{dateOfIssue}</Text>
        </Text>
        <Text style={styles.fontSize7}>
          {t.dateOfService}:{" "}
          <Text style={[styles.fontBold, styles.fontSize8]}>
            {dateOfService}
          </Text>
        </Text>
      </View>
    </View>
  );
}
