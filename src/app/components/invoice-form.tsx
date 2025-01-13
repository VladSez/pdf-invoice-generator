import React, { useCallback, useEffect } from "react";
import { useForm, Controller, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  invoiceSchema,
  type InvoiceData,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  type InvoiceItemData,
  invoiceItemSchema,
} from "@/app/schema";
import { useDebouncedCallback } from "use-debounce";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { loglib } from "@loglib/tracker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";

export const PDF_DATA_LOCAL_STORAGE_KEY = "invoicePdfData";
export const PDF_DATA_FORM_ID = "pdfInvoiceForm";

const calculateItemTotals = (item: InvoiceItemData | null) => {
  if (!item) return null;

  const amount = Number(item.amount) || 0;
  const netPrice = Number(item.netPrice) || 0;
  const calculatedNetAmount = amount * netPrice;
  const formattedNetAmount = Number(calculatedNetAmount.toFixed(2));

  let vatAmount = 0;
  if (item.vat && item.vat !== "NP" && item.vat !== "OO") {
    vatAmount = (formattedNetAmount * Number(item.vat)) / 100;
  }

  const formattedVatAmount = Number(vatAmount.toFixed(2));
  const formattedPreTaxAmount = Number(
    (formattedNetAmount + formattedVatAmount).toFixed(2)
  );

  return {
    ...item,
    netAmount: formattedNetAmount,
    vatAmount: formattedVatAmount,
    preTaxAmount: formattedPreTaxAmount,
  };
};

const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

interface InvoiceFormProps {
  invoiceData: InvoiceData;
  onInvoiceDataChange: (updatedData: InvoiceData) => void;
}

export function InvoiceForm({
  invoiceData,
  onInvoiceDataChange,
}: InvoiceFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<InvoiceData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoiceData,
    mode: "onChange",
  });

  const currency = useWatch({ control, name: "currency" });
  const invoiceItems = useWatch({ control, name: "items" });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // calculate totals and other values when invoice items change
  useEffect(() => {
    // run validations before calculations because user can input invalid data
    const validatedItems = z.array(invoiceItemSchema).safeParse(invoiceItems);

    if (!validatedItems.success) {
      console.error("Invalid items:", validatedItems.error);
      return;
    }

    // Always calculate total, even when no items
    const total = invoiceItems?.length
      ? Number(
          invoiceItems
            .reduce((sum, item) => sum + (item?.preTaxAmount || 0), 0)
            .toFixed(2)
        )
      : 0;

    // Update total first
    setValue("total", total, { shouldValidate: true });

    // Skip rest of calculations if no items
    if (!invoiceItems?.length) return;

    // Check if any relevant values have changed
    const hasChanges = invoiceItems.some((item) => {
      const calculated = calculateItemTotals(item);
      return (
        calculated?.netAmount !== item.netAmount ||
        calculated?.vatAmount !== item.vatAmount ||
        calculated?.preTaxAmount !== item.preTaxAmount
      );
    });
    if (!hasChanges) return;

    // Only update if there are actual changes
    const updatedItems = invoiceItems
      .map(calculateItemTotals)
      .filter(Boolean) as InvoiceItemData[];

    // Batch updates
    updatedItems.forEach((item, index) => {
      setValue(`items.${index}`, item, {
        shouldValidate: false, // Prevent validation during intermediate updates
      });
    });
  }, [invoiceItems, setValue]);

  // regenerate pdf on every input change with debounce
  const debouncedRegeneratePdfOnFormChange = useDebouncedCallback(
    (data) => {
      // regenerate pdf and run validations
      handleSubmit(onSubmit)(data);

      // validate with zod and save to local storage
      const result = invoiceSchema.safeParse(data);

      if (!result.success) {
        console.error("Invalid data:", result.error);
      } else {
        // success validation
        const stringifiedData = JSON.stringify(result.data);

        try {
          localStorage.setItem(PDF_DATA_LOCAL_STORAGE_KEY, stringifiedData);
        } catch (error) {
          console.error("Error saving to local storage:", error);
        }
      }
    },
    // delay in ms
    400
  );

  // subscribe to form changes to regenerate pdf on every input change
  useEffect(() => {
    const subscription = watch((value) => {
      debouncedRegeneratePdfOnFormChange(value);
    });

    return () => subscription.unsubscribe();
  }, [debouncedRegeneratePdfOnFormChange, watch]);

  // Add a wrapper function for remove item that triggers the form update
  const handleRemoveItem = useCallback(
    (index: number) => {
      remove(index);

      // analytics track event
      loglib.track("remove_invoice_item");

      // Manually trigger form submission after removal
      const currentFormData = watch();
      debouncedRegeneratePdfOnFormChange(currentFormData);
    },
    [remove, watch, debouncedRegeneratePdfOnFormChange]
  );

  const onSubmit = (data: InvoiceData) => {
    onInvoiceDataChange(data);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-4 space-y-3.5"
        id={PDF_DATA_FORM_ID}
      >
        {/* Language Select - Add this after Currency Select */}
        <div>
          <Label htmlFor="language" className="mb-1">
            Invoice PDF Language
          </Label>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <SelectNative
                {...field}
                id="language"
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "en" ? "English" : "Polish"}
                  </option>
                ))}
              </SelectNative>
            )}
          />
          {errors.language && (
            <ErrorMessage>{errors.language.message}</ErrorMessage>
          )}
        </div>

        {/* Invoice Number */}
        <div>
          <Label htmlFor="invoiceNumber" className="mb-1">
            Invoice Number
          </Label>
          <Controller
            name="invoiceNumber"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                id="invoiceNumber"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
            )}
          />
          {errors.invoiceNumber && (
            <ErrorMessage>{errors.invoiceNumber.message}</ErrorMessage>
          )}
        </div>

        {/* Date of Issue */}
        <div>
          <Label htmlFor="dateOfIssue" className="mb-1">
            Date of Issue
          </Label>
          <Controller
            name="dateOfIssue"
            control={control}
            render={({ field }) => (
              <Input {...field} type="date" id="dateOfIssue" className="" />
            )}
          />
          {errors.dateOfIssue && (
            <ErrorMessage>{errors.dateOfIssue.message}</ErrorMessage>
          )}
        </div>

        {/* Date of Service */}
        <div>
          <Label htmlFor="dateOfService" className="mb-1">
            Date of Service
          </Label>
          <Controller
            name="dateOfService"
            control={control}
            render={({ field }) => (
              <Input {...field} type="date" id="dateOfService" className="" />
            )}
          />
          {errors.dateOfService && (
            <ErrorMessage>{errors.dateOfService.message}</ErrorMessage>
          )}
        </div>

        {/* Invoice Type */}
        <div>
          <Label htmlFor="invoiceType" className="mb-1">
            Invoice Type
          </Label>
          <Controller
            name="invoiceType"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="invoiceType"
                rows={2}
                className=""
                placeholder="Enter invoice type"
              />
            )}
          />
          {errors.invoiceType && (
            <ErrorMessage>{errors.invoiceType.message}</ErrorMessage>
          )}
        </div>

        {/* Currency Select */}
        <div>
          <Label htmlFor="currency" className="mb-1">
            Currency
          </Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <SelectNative
                {...field}
                id="currency"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option
                    key={currency}
                    value={currency}
                    defaultValue={SUPPORTED_CURRENCIES[0]}
                  >
                    {currency}
                  </option>
                ))}
              </SelectNative>
            )}
          />
          {errors.currency && (
            <ErrorMessage>{errors.currency.message}</ErrorMessage>
          )}
        </div>

        {/* Seller Information */}
        <fieldset className="rounded-lg border p-4 shadow">
          <legend className="mb-2 text-lg font-medium text-gray-900">
            Seller Information
          </legend>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sellerName" className="mb-1">
                Name
              </Label>
              <Controller
                name="seller.name"
                control={control}
                render={({ field }) => (
                  <Textarea {...field} id="sellerName" rows={3} className="" />
                )}
              />
              {errors.seller?.name && (
                <ErrorMessage>{errors.seller.name.message}</ErrorMessage>
              )}
            </div>

            <div>
              <Label htmlFor="sellerAddress" className="mb-1">
                Address
              </Label>
              <Controller
                name="seller.address"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="sellerAddress"
                    rows={3}
                    className=""
                  />
                )}
              />
              {errors.seller?.address && (
                <ErrorMessage>{errors.seller.address.message}</ErrorMessage>
              )}
            </div>

            <div>
              <Label htmlFor="sellerVatNo" className="mb-1">
                VAT Number
              </Label>
              <Controller
                name="seller.vatNo"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="sellerVatNo"
                    type="text"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                  />
                )}
              />
              {errors.seller?.vatNo && (
                <ErrorMessage>{errors.seller.vatNo.message}</ErrorMessage>
              )}
            </div>

            <div>
              <Label htmlFor="sellerEmail" className="mb-1">
                Email
              </Label>
              <Controller
                name="seller.email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="sellerEmail"
                    type="email"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                  />
                )}
              />
              {errors.seller?.email && (
                <ErrorMessage>{errors.seller.email.message}</ErrorMessage>
              )}
            </div>

            <div>
              <Label htmlFor="sellerAccountNumber" className="mb-1">
                Account Number
              </Label>
              <Controller
                name="seller.accountNumber"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="sellerAccountNumber"
                    rows={3}
                    className=""
                  />
                )}
              />
              {errors.seller?.accountNumber && (
                <ErrorMessage>
                  {errors.seller.accountNumber.message}
                </ErrorMessage>
              )}
            </div>

            <div>
              <Label htmlFor="sellerSwiftBic" className="mb-1">
                SWIFT/BIC
              </Label>
              <Controller
                name="seller.swiftBic"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="sellerSwiftBic"
                    rows={3}
                    className=""
                  />
                )}
              />
              {errors.seller?.swiftBic && (
                <ErrorMessage>{errors.seller.swiftBic.message}</ErrorMessage>
              )}
            </div>
          </div>
        </fieldset>

        {/* Buyer Information */}
        <fieldset className="rounded-lg border p-4 shadow">
          <legend className="mb-2 text-lg font-medium text-gray-900">
            Buyer Information
          </legend>
          <div className="space-y-4">
            <div>
              <Label htmlFor="buyerName" className="mb-1">
                Name
              </Label>
              <Controller
                name="buyer.name"
                control={control}
                render={({ field }) => (
                  <Textarea {...field} id="buyerName" rows={3} className="" />
                )}
              />
              {errors.buyer?.name && (
                <ErrorMessage>{errors.buyer.name.message}</ErrorMessage>
              )}
            </div>

            <div>
              <Label htmlFor="buyerAddress" className="mb-1">
                Address
              </Label>
              <Controller
                name="buyer.address"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="buyerAddress"
                    rows={3}
                    className=""
                  />
                )}
              />
              {errors.buyer?.address && (
                <ErrorMessage>{errors.buyer.address.message}</ErrorMessage>
              )}
            </div>

            <div>
              <Label htmlFor="buyerVatNo" className="mb-1">
                VAT Number
              </Label>
              <Controller
                name="buyer.vatNo"
                control={control}
                render={({ field }) => (
                  <Textarea {...field} id="buyerVatNo" rows={3} className="" />
                )}
              />
              {errors.buyer?.vatNo && (
                <ErrorMessage>{errors.buyer.vatNo.message}</ErrorMessage>
              )}
            </div>

            <div>
              <Label htmlFor="buyerEmail" className="mb-1">
                Email
              </Label>
              <Controller
                name="buyer.email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="buyerEmail"
                    type="email"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                  />
                )}
              />
              {errors.buyer?.email && (
                <ErrorMessage>{errors.buyer.email.message}</ErrorMessage>
              )}
            </div>
          </div>
        </fieldset>

        {/* Invoice Items */}
        <fieldset className="rounded-lg border p-4 shadow">
          <legend className="mb-2 text-lg font-medium text-gray-900">
            Invoice Items
          </legend>

          {fields.map((field, index) => {
            return (
              <fieldset
                key={field.id}
                className="relative mb-4 rounded-lg border p-4 shadow"
              >
                {/* Delete invoice item button */}
                {index > 0 ? (
                  <div className="absolute -right-3 -top-10">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="flex items-center justify-center rounded-full bg-red-600 p-2 transition-colors hover:bg-red-700"
                      title="Delete invoice item"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : null}
                <legend className="relative mb-2 text-lg font-medium text-gray-900">
                  Item {index + 1}
                </legend>
                <div className="relative mb-8 space-y-4">
                  {/* Item Name */}
                  <div>
                    <Label htmlFor={`itemName${index}`} className="mb-1">
                      Item Name
                    </Label>
                    <Controller
                      name={`items.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          rows={4}
                          id={`itemName${index}`}
                          className=""
                        />
                      )}
                    />
                    {errors.items?.[index]?.name && (
                      <ErrorMessage>
                        {errors.items[index]?.name?.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* Item Amount */}
                  <div>
                    <Label htmlFor={`itemAmount${index}`} className="mb-1">
                      Amount
                    </Label>
                    <Controller
                      name={`items.${index}.amount`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemAmount${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                        />
                      )}
                    />
                    {errors.items?.[index]?.amount && (
                      <ErrorMessage>
                        {errors.items[index].amount.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* Item Unit */}
                  <div>
                    <Label htmlFor={`itemUnit${index}`} className="mb-1">
                      Unit
                    </Label>
                    <Controller
                      name={`items.${index}.unit`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemUnit${index}`}
                          type="text"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                        />
                      )}
                    />
                    {errors.items?.[index]?.unit && (
                      <ErrorMessage>
                        {errors.items[index].unit.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* New Net Price field */}
                  <div>
                    <Label htmlFor={`itemNetPrice${index}`} className="mb-1">
                      Net Price
                    </Label>
                    <Controller
                      name={`items.${index}.netPrice`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemNetPrice${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                        />
                      )}
                    />
                    {errors.items?.[index]?.netPrice && (
                      <ErrorMessage>
                        {errors.items[index].netPrice.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* New VAT field */}
                  <div>
                    <Label htmlFor={`itemVat${index}`} className="mb-1">
                      VAT (enter NP, OO or percentage value)
                    </Label>
                    <Controller
                      name={`items.${index}.vat`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemVat${index}`}
                          type="text"
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                        />
                      )}
                    />
                    {errors.items?.[index]?.vat && (
                      <ErrorMessage>
                        {errors.items[index].vat.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* New Net Amount field */}
                  <div>
                    <Label htmlFor={`itemNetAmount${index}`} className="mb-1">
                      Net Amount (calculated automatically based on Amount and
                      Net Price)
                    </Label>
                    <Controller
                      name={`items.${index}.netAmount`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemNetAmount${index}`}
                          type="number"
                          step="0.01"
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                        />
                      )}
                    />
                    {errors.items?.[index]?.netAmount && (
                      <ErrorMessage>
                        {errors.items[index].netAmount.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* This should probably be readonly field and calculated automatically based on VAT in % and Net Amount */}
                  <div>
                    <Label htmlFor={`itemVatAmount${index}`} className="mb-1">
                      VAT Amount (calculated automatically based on Net Amount
                      and VAT)
                    </Label>
                    <Controller
                      name={`items.${index}.vatAmount`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemVatAmount${index}`}
                          type="number"
                          step="1"
                          max="100"
                          min="0"
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                        />
                      )}
                    />
                    {errors.items?.[index]?.vatAmount && (
                      <ErrorMessage>
                        {errors.items[index].vatAmount.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* Pre-tax Amount field */}
                  <div>
                    <Label
                      htmlFor={`itemPreTaxAmount${index}`}
                      className="mb-1"
                    >
                      Pre-tax Amount (calculated automatically based on Net
                      Amount and VAT Amount)
                    </Label>
                    <Controller
                      name={`items.${index}.preTaxAmount`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemPreTaxAmount${index}`}
                          type="number"
                          step="0.01"
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                        />
                      )}
                    />
                    {errors.items?.[index]?.preTaxAmount && (
                      <ErrorMessage>
                        {errors.items[index].preTaxAmount.message}
                      </ErrorMessage>
                    )}
                  </div>
                </div>
              </fieldset>
            );
          })}

          <button
            type="button"
            onClick={() => {
              // analytics track event
              loglib.track("add_invoice_item");

              append({
                name: "",
                amount: 1,
                unit: "",
                netPrice: 0,
                vat: "NP",
                netAmount: 0,
                vatAmount: 0,
                preTaxAmount: 0,
              });
            }}
            className="mb-1 flex items-center text-sm font-medium text-gray-700 hover:text-black"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </button>
        </fieldset>

        {/* Total field (now with currency) */}
        <div className="">
          <div className="mt-5" />
          <Label htmlFor="total" className="mb-1">
            Total in {currency} (calculated automatically based on Amount and
            Net Price)
          </Label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">{currency}</span>
            </div>
            <Controller
              name="total"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  readOnly
                  id="total"
                  type="text"
                  value={field.value
                    .toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                    .replaceAll(/,/g, " ")}
                  className="block w-full cursor-not-allowed rounded-md border-gray-300 bg-gray-100 pl-12 focus-visible:border-indigo-500 focus-visible:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          {errors.total && <ErrorMessage>{errors.total.message}</ErrorMessage>}
        </div>

        {/* Payment Method */}
        <div>
          <Label htmlFor="paymentMethod" className="mb-1">
            Payment Method
          </Label>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="paymentMethod"
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
              />
            )}
          />
          {errors.paymentMethod && (
            <ErrorMessage>{errors.paymentMethod.message}</ErrorMessage>
          )}
        </div>

        {/* Payment Due */}
        <div>
          <Label htmlFor="paymentDue" className="mb-1">
            Payment Due
          </Label>
          <Controller
            name="paymentDue"
            control={control}
            render={({ field }) => (
              <Input {...field} id="paymentDue" type="date" className="" />
            )}
          />
          {errors.paymentDue && (
            <ErrorMessage>{errors.paymentDue.message}</ErrorMessage>
          )}
        </div>

        <div className="mb-4">
          <Label htmlFor="notes" className="mb-1">
            Notes
          </Label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea {...field} id="notes" rows={3} className="" />
            )}
          />
          {errors?.notes && (
            <ErrorMessage>{errors?.notes?.message}</ErrorMessage>
          )}
        </div>
      </form>
    </>
  );
}
