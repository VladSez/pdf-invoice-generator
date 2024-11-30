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

export const PDF_DATA_LOCAL_STORAGE_KEY = "invoicePdfData";

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

  // Add a wrapper function for remove that triggers the form update
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 mb-4"
      id="invoiceForm"
    >
      {/* Language Select - Add this after Currency Select */}
      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Invoice PDF Language
        </label>
        <Controller
          name="language"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="language"
              className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === "en" ? "English" : "Polish"}
                </option>
              ))}
            </select>
          )}
        />
        {errors.language && (
          <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
        )}
      </div>

      {/* Invoice Number */}
      <div>
        <label
          htmlFor="invoiceNumber"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Invoice Number
        </label>
        <Controller
          name="invoiceNumber"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              id="invoiceNumber"
              className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
            />
          )}
        />
        {errors.invoiceNumber && (
          <p className="mt-1 text-sm text-red-600">
            {errors.invoiceNumber.message}
          </p>
        )}
      </div>

      {/* Date of Issue */}
      <div>
        <label
          htmlFor="dateOfIssue"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date of Issue
        </label>
        <Controller
          name="dateOfIssue"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="date"
              id="dateOfIssue"
              className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
            />
          )}
        />
        {errors.dateOfIssue && (
          <p className="mt-1 text-sm text-red-600">
            {errors.dateOfIssue.message}
          </p>
        )}
      </div>

      {/* Date of Service */}
      <div>
        <label
          htmlFor="dateOfService"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date of Service
        </label>
        <Controller
          name="dateOfService"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="date"
              id="dateOfService"
              className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
            />
          )}
        />
        {errors.dateOfService && (
          <p className="mt-1 text-sm text-red-600">
            {errors.dateOfService.message}
          </p>
        )}
      </div>

      {/* Invoice Type */}
      <div>
        <label
          htmlFor="invoiceType"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Invoice Type
        </label>
        <Controller
          name="invoiceType"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              id="invoiceType"
              rows={2}
              className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
              placeholder="Enter invoice type"
            />
          )}
        />
        {errors.invoiceType && (
          <p className="mt-1 text-sm text-red-600">
            {errors.invoiceType.message}
          </p>
        )}
      </div>

      {/* Currency Select */}
      <div>
        <label
          htmlFor="currency"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Currency
        </label>
        <Controller
          name="currency"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="currency"
              className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
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
            </select>
          )}
        />
        {errors.currency && (
          <p className="mt-1 text-sm text-red-600">{errors.currency.message}</p>
        )}
      </div>

      {/* Seller Information */}
      <fieldset className="border p-4 rounded-lg shadow">
        <legend className="text-lg font-medium text-gray-900 mb-2">
          Seller Information
        </legend>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="sellerName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <Controller
              name="seller.name"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="sellerName"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.seller?.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.seller.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sellerAddress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address
            </label>
            <Controller
              name="seller.address"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="sellerAddress"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.seller?.address && (
              <p className="mt-1 text-sm text-red-600">
                {errors.seller.address.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sellerVatNo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              VAT Number
            </label>
            <Controller
              name="seller.vatNo"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="sellerVatNo"
                  type="text"
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.seller?.vatNo && (
              <p className="mt-1 text-sm text-red-600">
                {errors.seller.vatNo.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sellerEmail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <Controller
              name="seller.email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="sellerEmail"
                  type="email"
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.seller?.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.seller.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sellerAccountNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Account Number
            </label>
            <Controller
              name="seller.accountNumber"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="sellerAccountNumber"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.seller?.accountNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.seller.accountNumber.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sellerSwiftBic"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              SWIFT/BIC
            </label>
            <Controller
              name="seller.swiftBic"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="sellerSwiftBic"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.seller?.swiftBic && (
              <p className="mt-1 text-sm text-red-600">
                {errors.seller.swiftBic.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Buyer Information */}
      <fieldset className="border p-4 rounded-lg shadow">
        <legend className="text-lg font-medium text-gray-900 mb-2">
          Buyer Information
        </legend>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="buyerName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <Controller
              name="buyer.name"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="buyerName"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.buyer?.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.buyer.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="buyerAddress"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address
            </label>
            <Controller
              name="buyer.address"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="buyerAddress"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.buyer?.address && (
              <p className="mt-1 text-sm text-red-600">
                {errors.buyer.address.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="buyerVatNo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              VAT Number
            </label>
            <Controller
              name="buyer.vatNo"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="buyerVatNo"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.buyer?.vatNo && (
              <p className="mt-1 text-sm text-red-600">
                {errors.buyer.vatNo.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="buyerEmail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <Controller
              name="buyer.email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  id="buyerEmail"
                  type="email"
                  className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                />
              )}
            />
            {errors.buyer?.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.buyer.email.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Invoice Items */}
      <fieldset className="border p-4 rounded-lg shadow">
        <legend className="text-lg font-medium text-gray-900 mb-2">
          Invoice Items
        </legend>

        {fields.map((field, index) => {
          return (
            <fieldset
              key={field.id}
              className="border p-4 rounded-lg shadow mb-4 relative"
            >
              {/* Delete invoice item button */}
              {index > 0 ? (
                <div className="absolute -right-3 -top-10">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 p-2 transition-colors"
                    title="Delete invoice item"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : null}
              <legend className="text-lg font-medium text-gray-900 mb-2 relative">
                Item {index + 1}
              </legend>
              <div className="space-y-4 mb-8 relative">
                {/* Item Name */}
                <div>
                  <label
                    htmlFor={`itemName${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Item Name
                  </label>
                  <Controller
                    name={`items.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={4}
                        id={`itemName${index}`}
                        className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                      />
                    )}
                  />
                  {errors.items?.[index]?.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index]?.name?.message}
                    </p>
                  )}
                </div>

                {/* Item Amount */}
                <div>
                  <label
                    htmlFor={`itemAmount${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Amount
                  </label>
                  <Controller
                    name={`items.${index}.amount`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id={`itemAmount${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                      />
                    )}
                  />
                  {errors.items?.[index]?.amount && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index].amount.message}
                    </p>
                  )}
                </div>

                {/* Item Unit */}
                <div>
                  <label
                    htmlFor={`itemUnit${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Unit
                  </label>
                  <Controller
                    name={`items.${index}.unit`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id={`itemUnit${index}`}
                        type="text"
                        className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                      />
                    )}
                  />
                  {errors.items?.[index]?.unit && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index].unit.message}
                    </p>
                  )}
                </div>

                {/* New Net Price field */}
                <div>
                  <label
                    htmlFor={`itemNetPrice${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Net Price
                  </label>
                  <Controller
                    name={`items.${index}.netPrice`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id={`itemNetPrice${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                      />
                    )}
                  />
                  {errors.items?.[index]?.netPrice && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index].netPrice.message}
                    </p>
                  )}
                </div>

                {/* New VAT field */}
                <div>
                  <label
                    htmlFor={`itemVat${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    VAT (enter NP, OO or percentage value)
                  </label>
                  <Controller
                    name={`items.${index}.vat`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id={`itemVat${index}`}
                        type="text"
                        className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
                      />
                    )}
                  />
                  {errors.items?.[index]?.vat && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index].vat.message}
                    </p>
                  )}
                </div>

                {/* New Net Amount field */}
                <div>
                  <label
                    htmlFor={`itemNetAmount${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Net Amount (calculated automatically based on Amount and Net
                    Price)
                  </label>
                  <Controller
                    name={`items.${index}.netAmount`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id={`itemNetAmount${index}`}
                        type="number"
                        step="0.01"
                        readOnly
                        className="cursor-not-allowed block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2 bg-gray-100"
                      />
                    )}
                  />
                  {errors.items?.[index]?.netAmount && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index].netAmount.message}
                    </p>
                  )}
                </div>

                {/* This should probably be readonly field and calculated automatically based on VAT in % and Net Amount */}
                <div>
                  <label
                    htmlFor={`itemVatAmount${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    VAT Amount (calculated automatically based on Net Amount and
                    VAT)
                  </label>
                  <Controller
                    name={`items.${index}.vatAmount`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id={`itemVatAmount${index}`}
                        type="number"
                        step="1"
                        max="100"
                        min="0"
                        readOnly
                        className="cursor-not-allowed block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2 bg-gray-100"
                      />
                    )}
                  />
                  {errors.items?.[index]?.vatAmount && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index].vatAmount.message}
                    </p>
                  )}
                </div>

                {/* Pre-tax Amount field */}
                <div>
                  <label
                    htmlFor={`itemPreTaxAmount${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pre-tax Amount (calculated automatically based on Net Amount
                    and VAT Amount)
                  </label>
                  <Controller
                    name={`items.${index}.preTaxAmount`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id={`itemPreTaxAmount${index}`}
                        type="number"
                        step="0.01"
                        readOnly
                        className="cursor-not-allowedblock w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2 bg-gray-100"
                      />
                    )}
                  />
                  {errors.items?.[index]?.preTaxAmount && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index].preTaxAmount.message}
                    </p>
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
          className="flex items-center text-sm font-medium text-gray-700 mb-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </button>
      </fieldset>

      {/* Total field (now with currency) */}
      <div>
        <label
          htmlFor="total"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Total in {currency} (calculated automatically based on Amount and Net
          Price)
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">{currency}</span>
          </div>
          <Controller
            name="total"
            control={control}
            render={({ field }) => (
              <input
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
                className="cursor-not-allowed block w-full rounded-md border-gray-300 pl-12 focus-visible:border-indigo-500 focus-visible:ring-indigo-500 sm:text-sm bg-gray-100"
              />
            )}
          />
        </div>
        {errors.total && (
          <p className="mt-1 text-sm text-red-600">{errors.total.message}</p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <label
          htmlFor="paymentMethod"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Payment Method
        </label>
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="paymentMethod"
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
            />
          )}
        />
        {errors.paymentMethod && (
          <p className="mt-1 text-sm text-red-600">
            {errors.paymentMethod.message}
          </p>
        )}
      </div>

      {/* Payment Due */}
      <div>
        <label
          htmlFor="paymentDue"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Payment Due
        </label>
        <Controller
          name="paymentDue"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="paymentDue"
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
            />
          )}
        />
        {errors.paymentDue && (
          <p className="mt-1 text-sm text-red-600">
            {errors.paymentDue.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700"
        >
          Notes
        </label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              id="notes"
              rows={3}
              className="block w-full rounded-md border-gray-300 border shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 px-3 py-2"
            />
          )}
        />
        {errors?.notes && (
          <p className="mt-1 text-sm text-red-600">{errors?.notes?.message}</p>
        )}
      </div>
    </form>
  );
}
