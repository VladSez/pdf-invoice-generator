import { View, Text } from "@react-pdf/renderer";
import { styles } from ".";
import type { InvoiceData } from "@/app/schema";
import { translations } from "./translations";

import { getAmountInWords, getNumberFractionalPart } from "@/lib/utils";

export function InvoicePaymentTotals({
  invoiceData,
  formattedInvoiceTotal,
}: {
  invoiceData: InvoiceData;
  formattedInvoiceTotal: string;
}) {
  const language = invoiceData.language;
  const t = translations[language];

  const invoiceTotalInWords = getAmountInWords({
    amount: invoiceData?.total ?? 0,
    language,
  });

  const fractionalPart = getNumberFractionalPart(invoiceData?.total ?? 0);

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
