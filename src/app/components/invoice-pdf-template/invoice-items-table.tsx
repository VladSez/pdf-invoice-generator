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

  // we need to check only the first row, because all next rows are the same
  const isInvoiceItemNumberVisible =
    invoiceData.items[0].invoiceItemNumberIsVisible;
  const isNameFieldVisible = invoiceData.items[0].nameFieldIsVisible;
  const isTypeOfGTUFieldVisible = invoiceData.items[0].typeOfGTUFieldIsVisible;
  const isAmountFieldVisible = invoiceData.items[0].amountFieldIsVisible;
  const isUnitFieldVisible = invoiceData.items[0].unitFieldIsVisible;
  const isNetPriceFieldVisible = invoiceData.items[0].netPriceFieldIsVisible;
  const isVATFieldVisible = invoiceData.items[0].vatFieldIsVisible;
  const isNetAmountFieldVisible = invoiceData.items[0].netAmountFieldIsVisible;
  const isVATAmountFieldVisible = invoiceData.items[0].vatAmountFieldIsVisible;
  const isPreTaxAmountFieldVisible =
    invoiceData.items[0].preTaxAmountFieldIsVisible;

  return (
    <View style={{ marginBottom: 5, marginTop: 14 }}>
      <View style={styles.table}>
        {/* Table header columns */}
        <View style={styles.tableRow}>
          {/* Number column */}
          {isInvoiceItemNumberVisible ? (
            <View style={[styles.tableCol, styles.colNo, styles.center]}>
              <Text style={styles.tableCellBold}>{t.invoiceItemsTable.no}</Text>
            </View>
          ) : null}

          {/* Name of goods/service column */}
          {isNameFieldVisible ? (
            <View style={[styles.tableCol, styles.colName, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.nameOfGoodsService}
              </Text>
            </View>
          ) : null}

          {/* Type of GTU column */}
          {isTypeOfGTUFieldVisible ? (
            <View style={[styles.tableCol, styles.colGTU, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.typeOfGTU}
              </Text>
            </View>
          ) : null}

          {/* Amount column */}
          {isAmountFieldVisible ? (
            <View style={[styles.tableCol, styles.colAmount, styles.center]}>
              <Text style={[styles.tableCellBold]}>
                {t.invoiceItemsTable.amount}
              </Text>
            </View>
          ) : null}

          {/* Unit column */}
          {isUnitFieldVisible ? (
            <View style={[styles.tableCol, styles.colUnit, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.unit}
              </Text>
            </View>
          ) : null}

          {/* Net price column */}
          {isNetPriceFieldVisible ? (
            <View style={[styles.tableCol, styles.colNetPrice, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.netPrice}
              </Text>
            </View>
          ) : null}

          {/* VAT column */}
          {isVATFieldVisible ? (
            <View style={[styles.tableCol, styles.colVAT, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.vat}
              </Text>
            </View>
          ) : null}

          {/* Net amount column */}
          {isNetAmountFieldVisible ? (
            <View style={[styles.tableCol, styles.colNetAmount, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.netAmount}
              </Text>
            </View>
          ) : null}

          {/* VAT amount column */}
          {isVATAmountFieldVisible ? (
            <View style={[styles.tableCol, styles.colVATAmount, styles.center]}>
              <Text style={styles.tableCellBold}>
                {t.invoiceItemsTable.vatAmount}
              </Text>
            </View>
          ) : null}

          {/* Pre-tax amount column */}
          {isPreTaxAmountFieldVisible ? (
            <View
              style={[styles.tableCol, styles.colPreTaxAmount, styles.center]}
            >
              <Text style={[styles.tableCellBold]}>
                {t.invoiceItemsTable.preTaxAmount}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Table rows */}
        {invoiceData?.items.map((item, index) => {
          const formattedAmount = item.amount
            .toLocaleString("en-US", {
              style: "decimal",
              maximumFractionDigits: 3,
            })
            .replaceAll(",", " ");

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

          // Table row
          return (
            <View style={styles.tableRow} key={index}>
              {/* Number */}
              {isInvoiceItemNumberVisible ? (
                <View style={[styles.tableCol, styles.colNo]}>
                  <Text style={styles.tableCell}>{index + 1}.</Text>
                </View>
              ) : null}

              {/* Name of goods/service */}
              {isNameFieldVisible ? (
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
              ) : null}

              {/* Type of GTU */}
              {isTypeOfGTUFieldVisible ? (
                <View style={[styles.tableCol, styles.colGTU]}>
                  <Text style={[styles.tableCell]}>{item.typeOfGTU}</Text>
                </View>
              ) : null}

              {/* Amount */}
              {isAmountFieldVisible ? (
                <View style={[styles.tableCol, styles.colAmount]}>
                  <Text
                    style={[
                      styles.tableCell,
                      { textAlign: "right", marginRight: 2 },
                    ]}
                  >
                    {typeof item?.amount === "number"
                      ? formattedAmount
                      : "0.00"}
                  </Text>
                </View>
              ) : null}

              {/* Unit */}
              {isUnitFieldVisible ? (
                <View style={[styles.tableCol, styles.colUnit]}>
                  <Text style={[styles.tableCell, { textAlign: "center" }]}>
                    {item.unit}
                  </Text>
                </View>
              ) : null}

              {/* Net price */}
              {isNetPriceFieldVisible ? (
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
              ) : null}

              {/* VAT */}
              {isVATFieldVisible ? (
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
              ) : null}

              {/* Net amount */}
              {isNetAmountFieldVisible ? (
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
              ) : null}

              {/* VAT amount */}
              {isVATAmountFieldVisible ? (
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
              ) : null}

              {/* Pre-tax amount */}
              {isPreTaxAmountFieldVisible ? (
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
              ) : null}
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
