import { z } from "zod";

export const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "PLN"] as const;

export const SUPPORTED_LANGUAGES = ["en", "pl"] as const;
export type SupportedLanguages = (typeof SUPPORTED_LANGUAGES)[number];

export const invoiceItemSchema = z
  .object({
    name: z.string().min(1, "Item name is required").trim(),
    typeOfGTU: z.string().trim().optional(),
    amount: z
      .any()
      .refine((val) => val !== "", {
        message: "Amount is required",
      })
      .transform(Number)
      .refine((val) => val > 0, {
        message: "Amount must be positive",
      }),
    unit: z.string().min(1, "Unit is required").trim(),
    netPrice: z
      .any()
      .refine((val) => val !== "", {
        message: "Net price is required",
      })
      .transform(Number)
      .refine((val) => val >= 0, {
        message: "Net price must be non-negative",
      }),
    vat: z.union([
      z.enum(["NP", "OO"]),
      z
        .any()
        .refine((val) => val !== "", {
          message: "VAT is required",
        })
        .refine((val) => !isNaN(Number(val)), {
          message: "Must be a valid number or `NP`/`OO`",
        })
        .transform(Number)
        .refine((val) => val >= 0 && val <= 100, {
          message: "VAT must be between 0 and 100",
        }),
    ]),
    netAmount: z.coerce.number().nonnegative("Net amount must be non-negative"),
    vatAmount: z.coerce.number().nonnegative("VAT amount must be non-negative"),
    preTaxAmount: z.coerce
      .number()
      .nonnegative("Pre-tax amount must be non-negative"),
  })
  .strict();

export type InvoiceItemData = z.infer<typeof invoiceItemSchema>;

export const invoiceSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
  invoiceNumber: z.string().min(1, "Invoice number is required").trim(),
  dateOfIssue: z.string().min(1, "Date of issue is required").trim(),
  dateOfService: z.string().min(1, "Date of service is required").trim(),
  invoiceType: z.string().trim().optional(),
  seller: z.object({
    name: z.string().min(1, "Seller name is required").trim(),
    address: z.string().min(1, "Seller address is required").trim(),
    vatNo: z.string().min(1, "VAT number is required").trim(),
    email: z.string().email("Invalid email address").trim(),
    accountNumber: z.string().min(1, "Account number is required").trim(),
    swiftBic: z.string().min(1, "SWIFT/BIC is required").trim(),
  }),
  buyer: z.object({
    name: z.string().min(1, "Buyer name is required").trim(),
    address: z.string().min(1, "Buyer address is required").trim(),
    vatNo: z.string().min(1, "VAT number is required").trim(),
    email: z.string().email("Invalid email address").trim(),
  }),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  total: z.coerce.number().nonnegative("Total must be non-negative"),
  paymentMethod: z.string().min(1, "Payment method is required").trim(),
  paymentDue: z.string().min(1, "Payment due is required").trim(),
  currency: z.enum(SUPPORTED_CURRENCIES).default("EUR"),
  notes: z.string().trim().optional(),
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
