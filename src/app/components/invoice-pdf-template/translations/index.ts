import type { SupportedLanguages } from "@/app/schema/index";

// Add this interface before the translations object
interface TranslationSchema {
  invoiceNumber: string;
  dateOfIssue: string;
  dateOfService: string;
  invoiceType: string;
  seller: {
    name: string;
    vatNo: string;
    email: string;
    accountNumber: string;
    swiftBic: string;
  };
  buyer: {
    name: string;
    vatNo: string;
    email: string;
  };
  invoiceItemsTable: {
    no: string;
    nameOfGoodsService: string;
    typeOfGTU: string;
    amount: string;
    unit: string;
    netPrice: string;
    vat: string;
    netAmount: string;
    vatAmount: string;
    preTaxAmount: string;
    sum: string;
  };
  paymentInfo: {
    paymentMethod: string;
    paymentDate: string;
  };
  vatSummaryTable: {
    vatRate: string;
    net: string;
    vat: string;
    preTax: string;
    total: string;
  };
  paymentTotals: {
    toPay: string;
    paid: string;
    leftToPay: string;
    amountInWords: string;
  };
  personAuthorizedToReceive: string;
  personAuthorizedToIssue: string;
}

// Update the type assertion
export const translations = {
  en: {
    invoiceNumber: "Invoice No. of",
    dateOfIssue: "Date of issue",
    dateOfService: "Date of sales/of executing the service",
    invoiceType: "Invoice Type",
    seller: {
      name: "Seller",
      vatNo: "VAT no:",
      email: "e-mail",
      accountNumber: "Account Number",
      swiftBic: "SWIFT/BIC number",
    },
    buyer: {
      name: "Buyer",
      vatNo: "VAT no:",
      email: "e-mail",
    },
    invoiceItemsTable: {
      no: "No",
      nameOfGoodsService: "Name of goods/service",
      typeOfGTU: "Type of GTU",
      amount: "Amount",
      unit: "Unit",
      netPrice: "Net price",
      vat: "VAT",
      netAmount: "Net\n Amount",
      vatAmount: "VAT Amount",
      preTaxAmount: "Pre-tax amount",
      sum: "SUM",
    },
    paymentInfo: {
      paymentMethod: "Payment method",
      paymentDate: "Payment date",
    },
    vatSummaryTable: {
      vatRate: "VAT rate",
      net: "Net",
      vat: "VAT",
      preTax: "Pre-tax",
      total: "Total",
    },
    paymentTotals: {
      toPay: "To pay",
      paid: "Paid",
      leftToPay: "Left to pay",
      amountInWords: "Amount in words",
    },
    personAuthorizedToReceive: "Person authorized to receive",
    personAuthorizedToIssue: "Person authorized to issue",
  },
  pl: {
    invoiceNumber: "Faktura nr",
    dateOfIssue: "Data wystawienia",
    dateOfService: "Data sprzedaży / wykonania usługi",
    invoiceType: "Typ faktury",
    seller: {
      name: "Sprzedawca",
      vatNo: "NIP",
      email: "E-mail",
      accountNumber: "Nr konta",
      swiftBic: "Nr SWIFT/BIC",
    },
    buyer: {
      name: "Nabywca",
      vatNo: "NIP",
      email: "E-mail",
    },
    invoiceItemsTable: {
      no: "lp.",
      nameOfGoodsService: "Nazwa towaru/usługi",
      typeOfGTU: "Typ GTU",
      amount: "Ilość",
      unit: "Jm",
      netPrice: "Cena\n netto",
      vat: "VAT",
      netAmount: "Kwota\n netto",
      vatAmount: "Kwota VAT",
      preTaxAmount: "Kwota brutto",
      sum: "SUMA",
    },
    paymentInfo: {
      paymentMethod: "Sposób wpłaty",
      paymentDate: "Termin zapłaty",
    },
    vatSummaryTable: {
      vatRate: "Stawka VAT",
      net: "Netto",
      vat: "VAT",
      preTax: "Brutto",
      total: "Razem",
    },
    paymentTotals: {
      toPay: "Razem do zapłaty",
      paid: "Wpłacono",
      leftToPay: "Pozostało do zapłaty",
      amountInWords: "Kwota słownie",
    },
    personAuthorizedToReceive: "Osoba upoważniona do odbioru",
    personAuthorizedToIssue: "Osoba upoważniona do wystawienia",
  },
} as const satisfies Record<SupportedLanguages, TranslationSchema>;
