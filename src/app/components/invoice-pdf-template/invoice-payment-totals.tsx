import { View, Text } from "@react-pdf/renderer";
import { styles } from ".";
import type { InvoiceData } from "@/app/schema";
import n2words from "n2words";
import { translations } from "./translations";

// Get the fractional part of the total
const getFractionalPart = (total: number = 0) => {
  return Math.round((total % 1) * 100)
    .toString()
    .padStart(2, "0");
};

export function InvoicePaymentTotals({
  invoiceData,
  formattedInvoiceTotal,
}: {
  invoiceData: InvoiceData;
  formattedInvoiceTotal: string;
}) {
  const language = invoiceData.language;
  const t = translations[language];

  const invoiceTotalInWords = n2words(Math.floor(invoiceData?.total ?? 0), {
    lang: language,
  });

  const fractionalPart = getFractionalPart(invoiceData?.total ?? 0);

  const currency = invoiceData.currency;

  return (
    <View style={{ maxWidth: "55%" }}>
      <View style={{ width: "auto", alignSelf: "flex-start", marginTop: 0 }}>
        <Text
          style={[
            styles.subheader,
            {
              borderBottom: "1px solid black",
            },
            styles.fontSize11,
            styles.fontBold,
          ]}
        >
          {t.paymentTotals.toPay}: {formattedInvoiceTotal} {currency}
        </Text>
      </View>

      <Text style={styles.fontSize7}>
        {t.paymentTotals.paid}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>0.00 {currency}</Text>
      </Text>

      <Text style={[styles.boldText, styles.fontSize7]}>
        {t.paymentTotals.leftToPay}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>
          {formattedInvoiceTotal} {currency}
        </Text>
      </Text>

      <Text style={styles.fontSize7}>
        {t.paymentTotals.amountInWords}:{" "}
        <Text style={[styles.boldText, styles.fontSize8]}>
          {invoiceTotalInWords} {currency} {fractionalPart}/100
        </Text>
      </Text>
    </View>
  );
}
