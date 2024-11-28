import { Text, View } from "@react-pdf/renderer";
import { styles } from ".";
import type { InvoiceData } from "@/app/schema";
import { translations } from "./translations";

export function InvoicePaymentInfo({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const language = invoiceData.language;
  const t = translations[language];

  return (
    <View>
      <Text style={styles.fontSize7}>
        {t.paymentInfo.paymentMethod}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>
          {invoiceData?.paymentMethod}
        </Text>
      </Text>
      <Text style={[styles.fontSize7, { marginLeft: 9.75 }]}>
        {t.paymentInfo.paymentDate}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>
          {invoiceData?.paymentDue}
        </Text>
      </Text>
    </View>
  );
}
