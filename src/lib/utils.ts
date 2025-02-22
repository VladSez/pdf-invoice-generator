import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import n2words from "n2words";
import { toast } from "sonner";
import { SUPPORTED_LANGUAGES, type SupportedLanguages } from "@/app/schema";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAmountInWords({
  amount,
  language,
}: {
  amount: number;
  language: SupportedLanguages;
}) {
  const amountSchema = z
    .number()
    .finite()
    .nonnegative("Amount must be non-negative")
    .transform(Math.floor);

  const languageSchema = z.enum(SUPPORTED_LANGUAGES).default("en");

  const result = z
    .object({
      amount: amountSchema,
      language: languageSchema,
    })
    .safeParse({ amount, language });

  if (!result.success) {
    console.error("Validation error:", result.error);
    toast.error("Invalid input data");

    return "-/-";
  }

  let amountInWords = "";
  try {
    amountInWords = n2words(result.data.amount, {
      lang: result.data.language,
    });
  } catch (error) {
    console.error("Failed to convert number to words:", error);
    toast.error("Failed to convert number to words");

    amountInWords = Math.floor(amount ?? 0).toString();
  }

  return amountInWords;
}

// Get the fractional part of the total
export function getNumberFractionalPart(total: number = 0) {
  const schema = z.number().finite().nonnegative("Amount must be non-negative");

  const parsedTotal = schema.safeParse(total);

  if (!parsedTotal.success) {
    console.error("Validation error:", parsedTotal.error);
    toast.error("Invalid input data");

    return "-/-";
  }

  return Math.round((total % 1) * 100)
    .toString()
    .padStart(2, "0");
}
