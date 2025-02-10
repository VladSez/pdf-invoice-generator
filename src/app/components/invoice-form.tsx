import {
  invoiceItemSchema,
  invoiceSchema,
  SUPPORTED_CURRENCIES,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_LANGUAGES,
  type InvoiceData,
  type InvoiceItemData,
} from "@/app/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputHelperMessage } from "@/components/ui/input-helper-message";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { loglib } from "@loglib/tracker";
import dayjs from "dayjs";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import React, { useCallback, useEffect } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";

export const PDF_DATA_LOCAL_STORAGE_KEY = "invoicePdfData";
export const PDF_DATA_FORM_ID = "pdfInvoiceForm";
export const LOADING_TIMEOUT = 500;

const checkIfDateOnInvoiceIsInCurrentMonth = (date: string) => {
  const today = dayjs();

  if (!date) return false;

  const d2 = dayjs(date);

  if (!d2.isValid()) return false;

  const isSameMonth = today.isSame(d2, "month");

  return isSameMonth;
};

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

const Legend = ({ children }: { children: React.ReactNode }) => {
  return (
    <legend className="text-lg font-semibold text-gray-900">{children}</legend>
  );
};

const AlertIcon = () => {
  return <AlertTriangle className="mr-1 inline-block h-3 w-3 text-amber-500" />;
};

const ButtonHelper = ({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.ComponentProps<
  typeof Button
>) => {
  return (
    <Button
      _variant="link"
      _size="sm"
      className={cn("h-5 text-pretty p-0 text-left underline", className)}
      {...props}
    >
      {children}
    </Button>
  );
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

  const invoiceNumber = useWatch({ control, name: "invoiceNumber" });
  const dateOfIssue = useWatch({ control, name: "dateOfIssue" });
  const dateOfService = useWatch({ control, name: "dateOfService" });
  const paymentDue = useWatch({ control, name: "paymentDue" });

  const isDateOfIssueInCurrentMonth =
    checkIfDateOnInvoiceIsInCurrentMonth(dateOfIssue);

  const isDateOfServiceInCurrentMonth =
    checkIfDateOnInvoiceIsInCurrentMonth(dateOfService);

  const isPaymentDueBeforeDateOfIssue = dayjs(paymentDue).isBefore(
    dayjs(dateOfIssue)
  );

  const extractInvoiceMonthAndYear = invoiceNumber?.split("/")?.[1];

  const isInvoiceNumberInCurrentMonth =
    extractInvoiceMonthAndYear === dayjs().format("MM-YYYY");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // const sellerSelectId = useId();

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
        {/* Language PDF Select */}
        <div>
          <Label htmlFor="language" className="mb-1">
            Invoice PDF Language
          </Label>
          <Controller
            name="language"
            control={control}
            render={({ field }) => (
              <SelectNative {...field} id="language" className="block">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "en" ? "English" : "Polish"}
                  </option>
                ))}
              </SelectNative>
            )}
          />
          {errors.language ? (
            <ErrorMessage>{errors.language.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Select the language of the invoice
            </InputHelperMessage>
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
              <SelectNative {...field} id="currency" className="block">
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

          {errors.currency ? (
            <ErrorMessage>{errors.currency.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Select the currency of the invoice
            </InputHelperMessage>
          )}
        </div>

        {/* Date Format for Date of Issue, Date of Service and Payment Due Date, etc. */}
        <div>
          <Label htmlFor="dateFormat" className="mb-1">
            Date Format
          </Label>
          <Controller
            name="dateFormat"
            control={control}
            render={({ field }) => (
              <SelectNative {...field} id="dateFormat" className="block">
                {SUPPORTED_DATE_FORMATS.map((format) => {
                  const preview = dayjs().format(format);
                  const isDefault = format === SUPPORTED_DATE_FORMATS[0];

                  return (
                    <option key={format} value={format}>
                      {format} (Preview: {preview}){" "}
                      {isDefault ? "(default)" : ""}
                    </option>
                  );
                })}
              </SelectNative>
            )}
          />

          {errors.dateFormat ? (
            <ErrorMessage>{errors.dateFormat.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Select the date format of the invoice
            </InputHelperMessage>
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
          {!isInvoiceNumberInCurrentMonth && !errors.invoiceNumber ? (
            <InputHelperMessage>
              <span className="flex items-center text-balance">
                <AlertIcon />
                Invoice number does not match current month
              </span>

              <ButtonHelper
                onClick={() => {
                  const currentMonth = dayjs().format("MM-YYYY");
                  setValue("invoiceNumber", `1/${currentMonth}`);
                }}
              >
                Click to set the invoice number to the current month (
                {dayjs().format("MM-YYYY")})
              </ButtonHelper>
            </InputHelperMessage>
          ) : null}
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
          {!isDateOfIssueInCurrentMonth && !errors.dateOfIssue ? (
            <InputHelperMessage>
              <span className="flex items-center">
                <AlertIcon />
                Date of issue does not match current month
              </span>

              <ButtonHelper
                onClick={() => {
                  const currentMonth = dayjs().format("YYYY-MM-DD");

                  setValue("dateOfIssue", currentMonth);
                }}
              >
                Click to set the date to today ({dayjs().format("DD/MM/YYYY")})
              </ButtonHelper>
            </InputHelperMessage>
          ) : null}
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

          {!isDateOfServiceInCurrentMonth && !errors.dateOfService ? (
            <InputHelperMessage>
              <span className="flex items-center">
                <AlertIcon />
                Date of service does not match current month
              </span>

              <ButtonHelper
                onClick={() => {
                  const lastDayOfCurrentMonth = dayjs()
                    .endOf("month")
                    .format("YYYY-MM-DD");

                  setValue("dateOfService", lastDayOfCurrentMonth);
                }}
              >
                Click to set the date to the last day of the current month (
                {dayjs().endOf("month").format("DD/MM/YYYY")})
              </ButtonHelper>
            </InputHelperMessage>
          ) : null}
        </div>

        {/* Invoice Type */}
        <div>
          <div className="relative mb-2 flex items-center justify-between">
            <Label htmlFor="invoiceType" className="">
              Invoice Type
            </Label>

            {/* Show/hide Invoice Type field in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`invoiceTypeFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`invoiceTypeFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`invoiceTypeFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content='Show/Hide the "Invoice Type" Field in the PDF'
              />
            </div>
          </div>

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

        {/* Seller Information */}
        <fieldset className="rounded-lg border p-4 shadow">
          <Legend>Seller Information</Legend>

          {/* TODO: Will be done later */
          /*
          <div className="relative bottom-3 flex items-end justify-end gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                  <Label htmlFor={sellerSelectId}>Select Seller</Label>
                  <CustomTooltip
                    trigger={<Info className="h-3 w-3" />}
                    content="You can save multiple sellers to use them later"
                  />
                </div>
                <SelectNative
                  id={sellerSelectId}
                  className="block h-8 text-[12px] lg:text-[12px]"
                >
                  {/* TODO: fetch sellers from local storage */
          /*}
                  <option value="1">Seller 1</option>
                  <option value="2">Seller 2</option>
                  <option value="3">Seller 3</option>
                </SelectNative>
              </div>

              {/* TODO: add new seller modal + form and save to local storage */
          /*}
              <Button _variant="outline" _size="sm" className="">
                New Seller
                <Plus className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </> */}
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
              <div className="relative mb-2 flex items-center justify-between">
                <Label htmlFor="sellerVatNo" className="">
                  VAT Number
                </Label>

                {/* Show/hide Seller VAT Number field in PDF switch */}
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name={`seller.vatNoFieldIsVisible`}
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <Switch
                        {...field}
                        id={`sellerVatNoFieldIsVisible`}
                        checked={value}
                        onCheckedChange={onChange}
                        className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      />
                    )}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor={`sellerVatNoFieldIsVisible`}>
                        Show in PDF
                      </Label>
                    }
                    content='Show/Hide the "Seller VAT Number" Field in the PDF'
                  />
                </div>
              </div>
              <Controller
                name="seller.vatNo"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="sellerVatNo" type="text" className="" />
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
                    className=""
                  />
                )}
              />
              {errors.seller?.email && (
                <ErrorMessage>{errors.seller.email.message}</ErrorMessage>
              )}
            </div>

            {/* Account Number */}
            <div>
              <div className="relative mb-2 flex items-center justify-between">
                <Label htmlFor="sellerAccountNumber" className="">
                  Account Number
                </Label>

                {/* Show/hide Account Number field in PDF switch */}
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name={`seller.accountNumberFieldIsVisible`}
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <Switch
                        {...field}
                        id={`sellerAccountNumberFieldIsVisible`}
                        checked={value}
                        onCheckedChange={onChange}
                        className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      />
                    )}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor={`sellerAccountNumberFieldIsVisible`}>
                        Show in PDF
                      </Label>
                    }
                    content='Show/Hide the "Account Number" Field in the PDF'
                  />
                </div>
              </div>
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

            {/* SWIFT/BIC */}
            <div>
              <div className="relative mb-2 flex items-center justify-between">
                <Label htmlFor="sellerSwiftBic" className="">
                  SWIFT/BIC
                </Label>

                {/* Show/hide SWIFT/BIC field in PDF switch */}
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name={`seller.swiftBicFieldIsVisible`}
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <Switch
                        {...field}
                        id={`sellerSwiftBicFieldIsVisible`}
                        checked={value}
                        onCheckedChange={onChange}
                        className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      />
                    )}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor={`sellerSwiftBicFieldIsVisible`}>
                        Show in PDF
                      </Label>
                    }
                    content='Show/Hide the "SWIFT/BIC" Field in the PDF'
                  />
                </div>
              </div>

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
          <Legend>Buyer Information</Legend>
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

            {/* Buyer VAT Number */}
            <div>
              <div className="relative mb-2 flex items-center justify-between">
                <Label htmlFor="buyerVatNo" className="">
                  VAT Number
                </Label>

                {/* Show/hide Buyer VAT Number field in PDF switch */}
                <div className="inline-flex items-center gap-2">
                  <Controller
                    name={`buyer.vatNoFieldIsVisible`}
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <Switch
                        {...field}
                        id={`buyerVatNoFieldIsVisible`}
                        checked={value}
                        onCheckedChange={onChange}
                        className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                      />
                    )}
                  />
                  <CustomTooltip
                    trigger={
                      <Label htmlFor={`buyerVatNoFieldIsVisible`}>
                        Show in PDF
                      </Label>
                    }
                    content='Show/Hide the "Buyer VAT Number" Field in the PDF'
                  />
                </div>
              </div>

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
                  <Input {...field} id="buyerEmail" type="email" className="" />
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
          <Legend>Invoice Items</Legend>

          <div className="mb-3 space-y-4">
            {/* Show Number column on PDF switch */}
            <div className="relative flex items-center justify-between">
              <Label htmlFor={`itemInvoiceItemNumberIsVisible0`}>
                Show &quot;Number&quot; Column in the Invoice Items Table
              </Label>

              <Controller
                name={`items.0.invoiceItemNumberIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`itemInvoiceItemNumberIsVisible0`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
            </div>

            {/* Show VAT Table Summary in PDF switch */}
            <div className="relative flex items-center justify-between">
              <Label htmlFor={`vatTableSummaryIsVisible`}>
                Show &quot;VAT Table Summary&quot; in the PDF
              </Label>

              <Controller
                name={`vatTableSummaryIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`vatTableSummaryIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
            </div>
          </div>

          {fields.map((field, index) => {
            const isNotFirstItem = index > 0;
            const isFirstItem = index === 0;

            return (
              <fieldset
                key={field.id}
                className="relative mb-4 rounded-lg border p-4 shadow"
              >
                {/* Delete invoice item button */}
                {isNotFirstItem ? (
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
                <Legend>Item {index + 1}</Legend>
                <div className="relative mb-8 space-y-4">
                  <div>
                    {/* Invoice Item Name */}
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={`itemName${index}`} className="">
                        Name
                      </Label>

                      {/* Show/hide Name field in PDF switch */}
                      {isFirstItem ? (
                        <div className="inline-flex items-center gap-2">
                          <Controller
                            name={`items.${index}.nameFieldIsVisible`}
                            control={control}
                            render={({
                              field: { value, onChange, ...field },
                            }) => (
                              <Switch
                                {...field}
                                id={`itemNameFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              />
                            )}
                          />
                          <CustomTooltip
                            trigger={
                              <Label htmlFor={`itemNameFieldIsVisible${index}`}>
                                Show in PDF
                              </Label>
                            }
                            content="Show/hide the 'Name of Goods/Service' Column in the PDF"
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Name input */}
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

                  {/* Invoice Item Type of GTU */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={`itemTypeOfGTU${index}`} className="">
                        Type of GTU
                      </Label>

                      {/* Show/hide Type of GTU field in PDF switch */}
                      {isFirstItem ? (
                        <div className="inline-flex items-center gap-2">
                          <Controller
                            name={`items.${index}.typeOfGTUFieldIsVisible`}
                            control={control}
                            render={({
                              field: { value, onChange, ...field },
                            }) => (
                              <Switch
                                {...field}
                                id={`itemTypeOfGTUFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              />
                            )}
                          />
                          <CustomTooltip
                            trigger={
                              <Label
                                htmlFor={`itemTypeOfGTUFieldIsVisible${index}`}
                              >
                                Show in PDF
                              </Label>
                            }
                            content='Show/hide the "Type of GTU" Column in the PDF'
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Type of GTU input */}
                    <Controller
                      name={`items.${index}.typeOfGTU`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemTypeOfGTU${index}`}
                          className=""
                          type="text"
                        />
                      )}
                    />
                    {errors.items?.[index]?.typeOfGTU && (
                      <ErrorMessage>
                        {errors.items[index]?.typeOfGTU?.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* Invoice Item Amount */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={`itemAmount${index}`} className="">
                        Amount
                      </Label>

                      {/* Show/hide Amount field in PDF switch */}
                      {isFirstItem ? (
                        <div className="inline-flex items-center gap-2">
                          <Controller
                            name={`items.${index}.amountFieldIsVisible`}
                            control={control}
                            render={({
                              field: { value, onChange, ...field },
                            }) => (
                              <Switch
                                {...field}
                                id={`itemAmountFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              />
                            )}
                          />
                          <CustomTooltip
                            trigger={
                              <Label
                                htmlFor={`itemAmountFieldIsVisible${index}`}
                              >
                                Show in PDF
                              </Label>
                            }
                            content='Show/hide the "Amount" Column in the PDF'
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Amount input */}
                    <Controller
                      name={`items.${index}.amount`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemAmount${index}`}
                          type="number"
                          step="1"
                          min="0"
                          className=""
                        />
                      )}
                    />
                    {errors.items?.[index]?.amount && (
                      <ErrorMessage>
                        {errors.items[index].amount.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* Invoice Item Unit */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={`itemUnit${index}`} className="">
                        Unit
                      </Label>

                      {/* Show/hide Unit field in PDF switch */}
                      {isFirstItem ? (
                        <div className="inline-flex items-center gap-2">
                          <Controller
                            name={`items.${index}.unitFieldIsVisible`}
                            control={control}
                            render={({
                              field: { value, onChange, ...field },
                            }) => (
                              <Switch
                                {...field}
                                id={`itemUnitFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              />
                            )}
                          />
                          <CustomTooltip
                            trigger={
                              <Label htmlFor={`itemUnitFieldIsVisible${index}`}>
                                Show in PDF
                              </Label>
                            }
                            content='Show/hide the "Unit" Column in the PDF'
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Unit input */}
                    <Controller
                      name={`items.${index}.unit`}
                      control={control}
                      render={({ field }) => (
                        <Input {...field} id={`itemUnit${index}`} type="text" />
                      )}
                    />
                    {errors.items?.[index]?.unit && (
                      <ErrorMessage>
                        {errors.items[index].unit.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* Invoice Item Net Price */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={`itemNetPrice${index}`} className="">
                        Net Price in {currency}
                      </Label>

                      {/* Show/hide Net Price field in PDF switch */}
                      {isFirstItem ? (
                        <div className="inline-flex items-center gap-2">
                          <Controller
                            name={`items.${index}.netPriceFieldIsVisible`}
                            control={control}
                            render={({
                              field: { value, onChange, ...field },
                            }) => (
                              <Switch
                                {...field}
                                id={`itemNetPriceFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              />
                            )}
                          />
                          <CustomTooltip
                            trigger={
                              <Label
                                htmlFor={`itemNetPriceFieldIsVisible${index}`}
                              >
                                Show in PDF
                              </Label>
                            }
                            content='Show/hide the "Net Price" Column in the PDF'
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Net price input */}
                    <Controller
                      name={`items.${index}.netPrice`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemNetPrice${index}`}
                          type="number"
                          step="1"
                          min="0"
                          className=""
                        />
                      )}
                    />
                    {errors.items?.[index]?.netPrice && (
                      <ErrorMessage>
                        {errors.items[index].netPrice.message}
                      </ErrorMessage>
                    )}
                  </div>

                  {/* Invoice Item VAT */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={`itemVat${index}`} className="">
                        VAT
                      </Label>

                      {/* Show/hide VAT field in PDF switch */}
                      {isFirstItem ? (
                        <div className="inline-flex items-center gap-2">
                          <Controller
                            name={`items.${index}.vatFieldIsVisible`}
                            control={control}
                            render={({
                              field: { value, onChange, ...field },
                            }) => (
                              <Switch
                                {...field}
                                id={`itemVatFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              />
                            )}
                          />
                          <CustomTooltip
                            trigger={
                              <Label htmlFor={`itemVatFieldIsVisible${index}`}>
                                Show in PDF
                              </Label>
                            }
                            content='Show/hide the "VAT" Column in the PDF'
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* VAT input */}
                    <Controller
                      name={`items.${index}.vat`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemVat${index}`}
                          type="text"
                          className=""
                        />
                      )}
                    />

                    {errors.items?.[index]?.vat ? (
                      <ErrorMessage>
                        {errors.items[index].vat.message}
                      </ErrorMessage>
                    ) : (
                      <InputHelperMessage>
                        Enter NP, OO or percentage value
                      </InputHelperMessage>
                    )}
                  </div>

                  {/* Invoice Item Net Amount */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={`itemNetAmount${index}`} className="">
                        Net Amount in {currency}
                      </Label>

                      {/* Show/hide Net Amount field in PDF switch */}
                      {isFirstItem ? (
                        <div className="inline-flex items-center gap-2">
                          <Controller
                            name={`items.${index}.netAmountFieldIsVisible`}
                            control={control}
                            render={({
                              field: { value, onChange, ...field },
                            }) => (
                              <Switch
                                {...field}
                                id={`itemNetAmountFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              />
                            )}
                          />
                          <CustomTooltip
                            trigger={
                              <Label
                                htmlFor={`itemNetAmountFieldIsVisible${index}`}
                              >
                                Show in PDF
                              </Label>
                            }
                            content='Show/hide the "Net Amount" Column in the PDF'
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Invoice Item Net Amount (calculated automatically) */}
                    <Controller
                      name={`items.${index}.netAmount`}
                      control={control}
                      render={({ field }) => {
                        return (
                          <Input
                            {...field}
                            id={`itemNetAmount${index}`}
                            value={field.value.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            type="text"
                            readOnly
                            className="block w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                          />
                        );
                      }}
                    />

                    {errors.items?.[index]?.netAmount ? (
                      <ErrorMessage>
                        {errors.items[index].netAmount.message}
                      </ErrorMessage>
                    ) : (
                      <InputHelperMessage>
                        Calculated automatically based on Amount and Net Price
                      </InputHelperMessage>
                    )}
                  </div>

                  {/* Invoice Item VAT Amount (calculated automatically) */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={`itemVatAmount${index}`} className="">
                        VAT Amount in {currency}
                      </Label>

                      {/* Show/hide VAT Amount field in PDF switch */}
                      {isFirstItem ? (
                        <div className="inline-flex items-center gap-2">
                          <Controller
                            name={`items.${index}.vatAmountFieldIsVisible`}
                            control={control}
                            render={({
                              field: { value, onChange, ...field },
                            }) => (
                              <Switch
                                {...field}
                                id={`itemVatAmountFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              />
                            )}
                          />
                          <CustomTooltip
                            trigger={
                              <Label
                                htmlFor={`itemVatAmountFieldIsVisible${index}`}
                              >
                                Show in PDF
                              </Label>
                            }
                            content='Show/hide the "VAT Amount" Column in the PDF'
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* VAT amount input */}
                    <Controller
                      name={`items.${index}.vatAmount`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemVatAmount${index}`}
                          value={field.value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          type="text"
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                        />
                      )}
                    />

                    {errors.items?.[index]?.vatAmount ? (
                      <ErrorMessage>
                        {errors.items[index].vatAmount.message}
                      </ErrorMessage>
                    ) : (
                      <InputHelperMessage>
                        Calculated automatically based on Net Amount and VAT
                      </InputHelperMessage>
                    )}
                  </div>

                  {/* Pre-tax Amount field */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor={`itemPreTaxAmount${index}`} className="">
                        Pre-tax Amount in {currency}
                      </Label>

                      {/* Show/hide Pre-tax Amount field in PDF switch */}
                      {isFirstItem ? (
                        <div className="inline-flex items-center gap-2">
                          <Controller
                            name={`items.${index}.preTaxAmountFieldIsVisible`}
                            control={control}
                            render={({
                              field: { value, onChange, ...field },
                            }) => (
                              <Switch
                                {...field}
                                id={`itemPreTaxAmountFieldIsVisible${index}`}
                                checked={value}
                                onCheckedChange={onChange}
                                className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                              />
                            )}
                          />
                          <CustomTooltip
                            trigger={
                              <Label
                                htmlFor={`itemPreTaxAmountFieldIsVisible${index}`}
                              >
                                Show in PDF
                              </Label>
                            }
                            content='Show/hide the "Pre-tax Amount" Column in the PDF'
                          />
                        </div>
                      ) : null}
                    </div>

                    {/* Pre-tax amount input */}
                    <Controller
                      name={`items.${index}.preTaxAmount`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id={`itemPreTaxAmount${index}`}
                          value={field.value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          type="text"
                          readOnly
                          className="block w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50"
                        />
                      )}
                    />

                    {errors.items?.[index]?.preTaxAmount ? (
                      <ErrorMessage>
                        {errors.items[index].preTaxAmount.message}
                      </ErrorMessage>
                    ) : (
                      <InputHelperMessage>
                        Calculated automatically based on Net Amount and VAT
                      </InputHelperMessage>
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
                invoiceItemNumberIsVisible: true,
                name: "",
                nameFieldIsVisible: true,
                amount: 1,
                amountFieldIsVisible: true,
                unit: "",
                unitFieldIsVisible: true,
                netPrice: 0,
                netPriceFieldIsVisible: true,
                vat: "NP",
                vatFieldIsVisible: true,
                netAmount: 0,
                netAmountFieldIsVisible: true,
                vatAmount: 0,
                vatAmountFieldIsVisible: true,
                preTaxAmount: 0,
                preTaxAmountFieldIsVisible: true,
                typeOfGTU: "",
                typeOfGTUFieldIsVisible: true,
              });
            }}
            className="mb-1 flex items-center text-sm font-medium text-gray-700 hover:text-black"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add invoice item
          </button>
        </fieldset>

        {/* Total field (with currency) */}
        <div className="">
          <div className="mt-5" />
          <Label htmlFor="total" className="mb-1">
            Total in {currency}
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
                  value={field.value.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  className="block w-full cursor-not-allowed rounded-md border-gray-300 bg-gray-100 pl-12 focus-visible:border-indigo-500 focus-visible:ring-indigo-500 sm:text-sm"
                />
              )}
            />
          </div>
          {errors.total ? (
            <ErrorMessage>{errors.total.message}</ErrorMessage>
          ) : (
            <InputHelperMessage>
              Calculated automatically based on (Net Amount + VAT Amount) *
              Number of invoice items
            </InputHelperMessage>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <div className="relative mb-2 mt-6 flex items-center justify-between">
            <Label htmlFor="paymentMethod" className="">
              Payment Method
            </Label>

            {/* Show/hide Payment Method field in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`paymentMethodFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`paymentMethodFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`paymentMethodFieldIsVisible`}>
                    Show in PDF
                  </Label>
                }
                content='Show/Hide the "Payment Method" Field in the PDF'
              />
            </div>
          </div>

          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="paymentMethod"
                type="text"
                className="mt-1"
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
          {!errors.paymentDue && isPaymentDueBeforeDateOfIssue ? (
            <InputHelperMessage>
              <span className="flex items-center text-balance">
                <AlertIcon />
                Payment due date is before date of issue (
                {dayjs(dateOfIssue).format("DD.MM.YYYY")})
              </span>
              <ButtonHelper
                onClick={() => {
                  const newPaymentDue = dayjs(dateOfIssue)
                    .add(14, "days")
                    .format("YYYY-MM-DD");

                  setValue("paymentDue", newPaymentDue);
                }}
              >
                Click to set payment due date 14 days after the date of issue (
                {dayjs(dateOfIssue).add(14, "days").format("DD/MM/YYYY")})
              </ButtonHelper>
            </InputHelperMessage>
          ) : null}
        </div>

        {/* Notes */}
        <div className="mb-4">
          <div className="relative mb-2 flex items-center justify-between">
            <Label htmlFor="notes" className="">
              Notes
            </Label>

            {/* Show/hide Notes field in PDF switch */}
            <div className="inline-flex items-center gap-2">
              <Controller
                name={`notesFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`notesFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
              <CustomTooltip
                trigger={
                  <Label htmlFor={`notesFieldIsVisible`}>Show in PDF</Label>
                }
                content='Show/Hide the "Notes" Field in the PDF'
              />
            </div>
          </div>
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

        <div>
          <div className="relative mt-5 space-y-4">
            {/* Show/hide Person Authorized to Receive field in PDF switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor={`personAuthorizedToReceiveFieldIsVisible`}>
                Show &quot;Person Authorized to Receive&quot; Signature Field in
                the PDF
              </Label>

              <Controller
                name={`personAuthorizedToReceiveFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`personAuthorizedToReceiveFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
            </div>

            {/* Show/hide Person Authorized to Issue field in PDF switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor={`personAuthorizedToIssueFieldIsVisible`}>
                Show &quot;Person Authorized to Issue&quot; Signature Field in
                the PDF
              </Label>

              <Controller
                name={`personAuthorizedToIssueFieldIsVisible`}
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    {...field}
                    id={`personAuthorizedToIssueFieldIsVisible`}
                    checked={value}
                    onCheckedChange={onChange}
                    className="h-5 w-8 [&_span]:size-4 [&_span]:data-[state=checked]:translate-x-3 rtl:[&_span]:data-[state=checked]:-translate-x-3"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
