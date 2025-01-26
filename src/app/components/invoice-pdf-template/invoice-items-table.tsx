import { Text, View } from "@react-pdf/renderer";
import { styles } from ".";
import type { InvoiceData } from "@/app/schema";
import { translations } from "./translations";

export function InvoiceItemsTable({
  invoiceData,
  formattedInvoiceTotal,
}: {
  invoiceData: InvoiceData;
  formattedInvoiceTotal: string;
}) {
  const language = invoiceData.language;
  const t = translations[language];

  return (
    <View style={{ marginBottom: 5, marginTop: 14 }}>
      <View style={styles.table}>
        {/* Table header */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCol, styles.colNo, styles.center]}>
            <Text style={styles.tableCellBold}>{t.invoiceItemsTable.no}</Text>
          </View>
          <View style={[styles.tableCol, styles.colName, styles.center]}>
            <Text style={styles.tableCellBold}>
              {t.invoiceItemsTable.nameOfGoodsService}
            </Text>
          </View>
          <View style={[styles.tableCol, styles.colGTU, styles.center]}>
            <Text style={styles.tableCellBold}>
              {t.invoiceItemsTable.typeOfGTU}
            </Text>
          </View>
          <View style={[styles.tableCol, styles.colAmount, styles.center]}>
            <Text style={[styles.tableCellBold, {}]}>
              {t.invoiceItemsTable.amount}
            </Text>
          </View>
          <View style={[styles.tableCol, styles.colUnit, styles.center]}>
            <Text style={styles.tableCellBold}>{t.invoiceItemsTable.unit}</Text>
          </View>
          <View style={[styles.tableCol, styles.colNetPrice, styles.center]}>
            <Text style={styles.tableCellBold}>
              {t.invoiceItemsTable.netPrice}
            </Text>
          </View>
          <View style={[styles.tableCol, styles.colVAT, styles.center]}>
            <Text style={styles.tableCellBold}>{t.invoiceItemsTable.vat}</Text>
          </View>
          <View style={[styles.tableCol, styles.colNetAmount, styles.center]}>
            <Text style={styles.tableCellBold}>
              {t.invoiceItemsTable.netAmount}
            </Text>
          </View>
          <View style={[styles.tableCol, styles.colVATAmount, styles.center]}>
            <Text style={styles.tableCellBold}>
              {t.invoiceItemsTable.vatAmount}
            </Text>
          </View>
          <View
            style={[styles.tableCol, styles.colPreTaxAmount, styles.center]}
          >
            <Text style={[styles.tableCellBold]}>
              {t.invoiceItemsTable.preTaxAmount}
            </Text>
          </View>
        </View>

        {/* Table rows */}
        {invoiceData?.items.map((item, index) => {
          const formattedNetPrice = item.netPrice
            .toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
            .replaceAll(",", " ");

          const formattedNetAmount = item.netAmount
            .toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
            .replaceAll(",", " ");

          const formattedVATAmount = item.vatAmount
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
              {/* No */}
              <View style={[styles.tableCol, styles.colNo]}>
                <Text style={styles.tableCell}>{index + 1}.</Text>
              </View>

              {/* Name of goods/service */}
              <View style={[styles.tableCol, styles.colName]}>
                <Text
                  style={[
                    styles.tableCell,
                    { textAlign: "left", marginLeft: 2, marginRight: 2 },
                  ]}
                >
                  {item.name}
                </Text>
              </View>

              {/* Type of GTU */}
              <View style={[styles.tableCol, styles.colGTU]}>
                <Text style={[styles.tableCell]}>{item.typeOfGTU}</Text>
              </View>

              <View style={[styles.tableCol, styles.colAmount]}>
                <Text
                  style={[
                    styles.tableCell,
                    { textAlign: "right", marginRight: 2 },
                  ]}
                >
                  {typeof item?.amount === "number"
                    ? item.amount.toFixed(2)
                    : "0.00"}
                </Text>
              </View>

              {/* Unit */}
              <View style={[styles.tableCol, styles.colUnit]}>
                <Text style={[styles.tableCell, { textAlign: "center" }]}>
                  {item.unit}
                </Text>
              </View>

              {/* Net price */}
              <View style={[styles.tableCol, styles.colNetPrice]}>
                <Text
                  style={[
                    styles.tableCell,
                    { textAlign: "right", marginRight: 2 },
                  ]}
                >
                  {typeof item?.netPrice === "number"
                    ? formattedNetPrice
                    : "0.00"}
                </Text>
              </View>

              {/* VAT */}
              <View
                style={[
                  styles.tableCol,
                  styles.colVAT,
                  { textAlign: "center" },
                ]}
              >
                <Text style={styles.tableCell}>
                  {isNaN(Number(item.vat)) ? item.vat : `${item.vat}%`}
                </Text>
              </View>

              {/* Net amount */}
              <View style={[styles.tableCol, styles.colNetAmount]}>
                <Text
                  style={[
                    styles.tableCell,
                    { textAlign: "right", marginRight: 2 },
                  ]}
                >
                  {typeof item?.netAmount === "number"
                    ? formattedNetAmount
                    : "0.00"}
                </Text>
              </View>

              {/* VAT amount */}
              <View style={[styles.tableCol, styles.colVATAmount]}>
                <Text
                  style={[
                    styles.tableCell,
                    { textAlign: "right", marginRight: 2 },
                  ]}
                >
                  {typeof item?.vatAmount === "number"
                    ? formattedVATAmount
                    : "0.00"}
                </Text>
              </View>

              {/* Pre-tax amount */}
              <View style={[styles.tableCol, styles.colPreTaxAmount]}>
                <Text
                  style={[
                    styles.tableCell,
                    {
                      textAlign: "right",
                      marginRight: 2,
                    },
                  ]}
                >
                  {typeof item?.preTaxAmount === "number"
                    ? formattedPreTaxAmount
                    : "0.00"}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Table footer */}
        <View style={styles.tableRow}>
          {/* Empty cells */}
          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { borderRight: 0 }]}></View>

          <View style={[styles.tableCol, { width: "100%" }]}>
            <Text
              style={[
                styles.tableCell,
                {
                  marginTop: 2,
                  marginBottom: 2,
                  textAlign: "right",
                  marginRight: 5,
                },
              ]}
            >
              {t.invoiceItemsTable.sum}:{" "}
              <Text style={[styles.boldText, styles.fontSize8]}>
                {formattedInvoiceTotal}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
