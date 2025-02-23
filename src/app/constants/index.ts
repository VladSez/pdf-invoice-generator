"use client";

import {
  DEFAULT_SELLER_DATA,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  SUPPORTED_DATE_FORMATS,
  type InvoiceData,
} from "../schema";
import dayjs from "dayjs";

const today = dayjs().format("YYYY-MM-DD");
const lastDayOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
const invoiceCurrentMonthAndYear = dayjs().format("MM-YYYY");
const paymentDue = dayjs(today).add(14, "days").format("YYYY-MM-DD");

const EUR = SUPPORTED_CURRENCIES[0];
const EN = SUPPORTED_LANGUAGES[0];
const DEFAULT_DATE_FORMAT = SUPPORTED_DATE_FORMATS[0];

export const INITIAL_INVOICE_DATA = {
  language: EN,
  currency: EUR,
  invoiceNumber: `1/${invoiceCurrentMonthAndYear}`,

  dateOfIssue: today,
  dateOfService: lastDayOfMonth,
  dateFormat: DEFAULT_DATE_FORMAT,

  invoiceType: "Reverse Charge",
  invoiceTypeFieldIsVisible: true,

  seller: DEFAULT_SELLER_DATA,
  buyer: {
    name: "Buyer name",
    address: "Buyer address",
    vatNo: "Buyer vat number",
    vatNoFieldIsVisible: true,
    email: "buyer@email.com",
  },
  items: [
    {
      invoiceItemNumberIsVisible: true,

      name: "Item name",
      nameFieldIsVisible: true,

      typeOfGTU: "",
      typeOfGTUFieldIsVisible: true,

      amount: 1,
      amountFieldIsVisible: true,

      unit: "service",
      unitFieldIsVisible: true,

      netPrice: 0,
      netPriceFieldIsVisible: true,

      vat: "NP",
      vatFieldIsVisible: true,

      netAmount: 0,
      netAmountFieldIsVisible: true,

      vatAmount: 0.0,
      vatAmountFieldIsVisible: true,

      preTaxAmount: 0,
      preTaxAmountFieldIsVisible: true,
    },
  ],
  total: 0,
  paymentMethod: "wire transfer",

  paymentDue: paymentDue,

  notes: "Reverse charge",
  notesFieldIsVisible: true,

  vatTableSummaryIsVisible: true,
  paymentMethodFieldIsVisible: true,
  personAuthorizedToReceiveFieldIsVisible: true,
  personAuthorizedToIssueFieldIsVisible: true,
} as const satisfies InvoiceData;
