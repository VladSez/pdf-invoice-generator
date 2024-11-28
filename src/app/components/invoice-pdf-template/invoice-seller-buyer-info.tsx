import { Text, View } from "@react-pdf/renderer";
import { styles } from ".";
import type { InvoiceData } from "@/app/schema";
import { translations } from "./translations";

export function InvoiceSellerBuyerInfo({
  invoiceData,
}: {
  invoiceData: InvoiceData;
}) {
  const language = invoiceData.language;
  const t = translations[language];

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        maxWidth: "512px",
      }}
    >
      {/* Seller info */}
      <View style={{ width: "280px", marginRight: 25 }}>
        <Text style={styles.subheader}>{t.seller.name}</Text>
        <View>
          <Text style={[styles.fontBold, styles.fontSize10]}>
            {invoiceData?.seller.name}
          </Text>
          <Text style={[styles.boldText, styles.fontSize8]}>
            {invoiceData?.seller.address}
          </Text>

          <View style={{ marginTop: 2 }}>
            <Text style={[styles.fontSize7]}>
              {t.seller.vatNo}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.seller.vatNo}
              </Text>
            </Text>
            <Text style={styles.fontSize7}>
              {t.seller.email}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {invoiceData?.seller.email}
              </Text>
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.fontSize8}>
            {t.seller.accountNumber} -{" "}
            <Text style={[styles.boldText, styles.fontSize8]}>
              {invoiceData?.seller.accountNumber}
            </Text>
          </Text>
          <Text style={styles.fontSize7}>
            {t.seller.swiftBic}:{" "}
            <Text style={[styles.boldText, styles.fontSize8]}>
              {invoiceData?.seller.swiftBic}
            </Text>
          </Text>
        </View>
      </View>

      {/* Buyer info */}
      <View style={{ width: "280px" }}>
        <Text style={styles.subheader}>{t.buyer.name}</Text>
        <Text style={[styles.fontBold, styles.fontSize10]}>
          {invoiceData?.buyer.name}
        </Text>
        <Text
          style={[styles.boldText, styles.fontSize8, { maxWidth: "280px" }]}
        >
          {invoiceData?.buyer.address}
        </Text>

        <View style={{ marginTop: 2 }}>
          <Text style={styles.fontSize7}>
            {t.buyer.vatNo}:{" "}
            <Text style={[styles.boldText, styles.fontSize8]}>
              {invoiceData?.buyer.vatNo}
            </Text>
          </Text>
          <Text style={styles.fontSize7}>
            {t.buyer.email}:{" "}
            <Text style={[styles.boldText, styles.fontSize8]}>
              {invoiceData?.buyer.email}
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
