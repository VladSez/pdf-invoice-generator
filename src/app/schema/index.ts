import { z } from "zod";

export const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "PLN"] as const;

export const SUPPORTED_LANGUAGES = ["en", "pl"] as const;
export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

export const SUPPORTED_DATE_FORMATS = [
  "YYYY-MM-DD", // 2024-03-20
  "DD/MM/YYYY", // 20/03/2024
  "MM/DD/YYYY", // 03/20/2024
  "D MMMM YYYY", // 20 March 2024
  "MMMM D, YYYY", // March 20, 2024
  "DD.MM.YYYY", // 20.03.2024
  "DD-MM-YYYY", // 20-03-2024
  "YYYY.MM.DD", // 2024.03.20
] as const;

export const DEFAULT_SELLER_DATA = {
  name: "Seller name",
  address: "Seller address",

  vatNo: "Seller vat number",
  vatNoFieldIsVisible: true,

  email: "seller@email.com",

  accountNumber: "Seller account number",
  accountNumberFieldIsVisible: true,

  swiftBic: "Seller swift bic",
  swiftBicFieldIsVisible: true,
} as const satisfies SellerData;

export type SupportedDateFormat = (typeof SUPPORTED_DATE_FORMATS)[number];

export const invoiceItemSchema = z
  .object({
    // Show/hide Number column on PDF
    invoiceItemNumberIsVisible: z.boolean().default(true),

    name: z
      .string()
      .min(1, "Item name is required")
      .max(500, "Item name must not exceed 500 characters")
      .trim(),
    nameFieldIsVisible: z.boolean().default(true),

    typeOfGTU: z
      .string()
      .max(50, "Type of GTU must not exceed 50 characters")
      .trim()
      .optional()
      .default(""),
    typeOfGTUFieldIsVisible: z.boolean().default(true),

    amount: z
      .any()
      .refine((val) => val !== "", {
        message: "Amount is required",
      })
      .transform(Number)
      .refine((val) => val > 0, {
        message: "Amount must be positive",
      })
      .refine((val) => val <= 9_999_999_999.99, {
        message: "Amount must not exceed 9.999.999.999",
      }),
    amountFieldIsVisible: z.boolean().default(true),

    unit: z.string().trim().optional(),
    unitFieldIsVisible: z.boolean().default(true),

    netPrice: z
      .any()
      .refine((val) => val !== "", {
        message: "Net price is required",
      })
      .transform(Number)
      .refine((val) => val >= 0, {
        message: "Net price must be >= 0",
      })
      .refine((val) => val <= 100_000_000_000, {
        message: "Net price must not exceed 100 billion",
      }),
    netPriceFieldIsVisible: z.boolean().default(true),

    vat: z.union([
      z.enum(["NP", "OO"]),
      z
        .any()
        .refine((val) => val !== "", {
          message: "VAT is required (0-100 or NP or OO)",
        })
        .refine((val) => !isNaN(Number(val)), {
          message: "Must be a valid number (0-100) or NP or OO",
        })
        .transform(Number)
        .refine((val) => val >= 0 && val <= 100, {
          message: "VAT must be between 0 and 100",
        }),
    ]),
    vatFieldIsVisible: z.boolean().default(true),

    netAmount: z.coerce.number().nonnegative("Net amount must be non-negative"),
    netAmountFieldIsVisible: z.boolean().default(true),

    vatAmount: z.coerce.number().nonnegative("VAT amount must be non-negative"),
    vatAmountFieldIsVisible: z.boolean().default(true),

    preTaxAmount: z.coerce
      .number()
      .nonnegative("Pre-tax amount must be non-negative"),
    preTaxAmountFieldIsVisible: z.boolean().default(true),
  })
  .strict();

export type InvoiceItemData = z.infer<typeof invoiceItemSchema>;

export const sellerSchema = z
  .object({
    id: z.string().optional(),

    name: z
      .string()
      .min(1, "Seller name is required")
      .max(500, "Seller name must not exceed 500 characters")
      .trim(),
    address: z
      .string()
      .min(1, "Seller address is required")
      .max(500, "Seller address must not exceed 500 characters")
      .trim(),

    vatNo: z
      .string()
      .max(200, "VAT number must not exceed 200 characters")
      .trim()
      .optional(),
    vatNoFieldIsVisible: z.boolean().default(true),

    email: z.string().email("Invalid email address").trim(),

    accountNumber: z
      .string()
      .max(200, "Account number must not exceed 200 characters")
      .trim()
      .optional(),
    accountNumberFieldIsVisible: z.boolean().default(true),

    swiftBic: z
      .string()
      .max(200, "SWIFT/BIC must not exceed 200 characters")
      .trim()
      .optional(),
    swiftBicFieldIsVisible: z.boolean().default(true),
  })
  .strict();

export type SellerData = z.infer<typeof sellerSchema>;

export const buyerSchema = z
  .object({
    id: z.string().optional(),

    name: z
      .string()
      .min(1, "Buyer name is required")
      .max(500, "Buyer name must not exceed 500 characters")
      .trim(),
    address: z
      .string()
      .min(1, "Buyer address is required")
      .max(500, "Buyer address must not exceed 500 characters")
      .trim(),
    vatNo: z
      .string()
      .max(200, "VAT number must not exceed 200 characters")
      .trim()
      .optional(),
    vatNoFieldIsVisible: z.boolean().default(true),

    email: z.string().email("Invalid email address").trim(),
  })
  .strict();

export type BuyerData = z.infer<typeof buyerSchema>;

export const invoiceSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
  dateFormat: z.enum(SUPPORTED_DATE_FORMATS).default("YYYY-MM-DD"),
  currency: z.enum(SUPPORTED_CURRENCIES).default("EUR"),

  invoiceNumber: z.string().min(1, "Invoice number is required").trim(),
  dateOfIssue: z.string().min(1, "Date of issue is required").trim(),
  dateOfService: z.string().min(1, "Date of service is required").trim(),

  invoiceType: z
    .string()
    .max(500, "Invoice type must not exceed 500 characters")
    .trim()
    .optional(),
  invoiceTypeFieldIsVisible: z.boolean().default(true),

  seller: sellerSchema,
  buyer: buyerSchema,

  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  total: z.coerce.number().nonnegative("Total must be non-negative"),

  // Show/hide VAT Table Summary on PDF
  vatTableSummaryIsVisible: z.boolean().default(true),

  paymentMethod: z
    .string()
    .max(500, "Payment method must not exceed 500 characters")
    .trim()
    .optional(),
  paymentMethodFieldIsVisible: z.boolean().default(true),

  paymentDue: z.string().min(1, "Payment due is required").trim(),

  notes: z
    .string()
    .max(3500, "Notes must not exceed 3500 characters")
    .trim()
    .optional(),
  notesFieldIsVisible: z.boolean().default(true),

  personAuthorizedToReceiveFieldIsVisible: z.boolean().default(true),
  personAuthorizedToIssueFieldIsVisible: z.boolean().default(true),
});

export type InvoiceData = z.infer<typeof invoiceSchema>;

// https://github.com/colinhacks/zod/discussions/2814#discussioncomment-7121769
// const zodInputStringPipe = (zodPipe: ZodTypeAny) =>
//   z
//     .string()
//     .transform((value) => (value === "" ? null : value))
//     .nullable()
//     .refine((value) => value === null || !isNaN(Number(value)), {
//       message: "Nombre Invalide",
//     })
//     .transform((value) => (value === null ? 0 : Number(value)))
//     .pipe(zodPipe);
