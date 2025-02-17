"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sellerSchema, type SellerData } from "@/app/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { CustomTooltip } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { SELLERS_LOCAL_STORAGE_KEY } from "./seller-management";
import { z } from "zod";

const SELLER_FORM_ID = "seller-form";
interface SellerDialogProps {
  isOpen: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  onSellerSaved?: (seller: SellerData) => void;
  initialData: SellerData | null;
}

export function SellerDialog({
  isOpen,
  onClose,
  onSellerSaved,
  initialData,
}: SellerDialogProps) {
  const isEditMode = Boolean(initialData);

  console.log({ initialData, isEditMode });

  const form = useForm<SellerData>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      id: initialData?.id ?? "",
      name: initialData?.name ?? "",
      address: initialData?.address ?? "",
      vatNo: initialData?.vatNo ?? "",
      email: initialData?.email ?? "",
      accountNumber: initialData?.accountNumber ?? "",
      swiftBic: initialData?.swiftBic ?? "",
      vatNoFieldIsVisible: initialData?.vatNoFieldIsVisible ?? true,
      accountNumberFieldIsVisible:
        initialData?.accountNumberFieldIsVisible ?? true,
      swiftBicFieldIsVisible: initialData?.swiftBicFieldIsVisible ?? true,
    },
  });

  function onSubmit(formValues: SellerData) {
    try {
      const newSellerFormValues = {
        ...formValues,
        // Generate a random id
        id: Date.now().toString(),
      };

      // Get existing sellers or initialize empty array
      const sellers = localStorage.getItem(SELLERS_LOCAL_STORAGE_KEY);
      const existingSellers = sellers ? JSON.parse(sellers) : [];

      // Validate existing sellers array with Zod
      const existingSellersValidationResult = z
        .array(sellerSchema)
        .safeParse(existingSellers);

      if (!existingSellersValidationResult.success) {
        console.error(
          "Invalid existing sellers data:",
          existingSellersValidationResult.error
        );

        // Show error toast
        toast.error("Error loading existing sellers", {
          richColors: true,
        });

        // Reset localStorage if validation fails
        localStorage.setItem(SELLERS_LOCAL_STORAGE_KEY, JSON.stringify([]));

        return;
      }

      // Validate new seller data against existing sellers
      const isDuplicateName = existingSellers.some(
        (seller: SellerData) => seller.name === newSellerFormValues.name
      );

      if (isDuplicateName) {
        form.setError("name", {
          type: "manual",
          message: "A seller with this name already exists",
        });

        // Focus on the name input field for user to fix the error
        form.setFocus("name");

        // Show error toast
        toast.error("A seller with this name already exists", {
          richColors: true,
        });

        return;
      }

      const existingSellersData = existingSellersValidationResult.data ?? [];

      // Add new seller with random id
      const updatedSellers = [
        ...existingSellersData,
        {
          ...newSellerFormValues,
        },
      ] satisfies SellerData[];

      const stringifiedUpdatedSellers = JSON.stringify(updatedSellers);

      // Save to localStorage
      localStorage.setItem(
        SELLERS_LOCAL_STORAGE_KEY,
        stringifiedUpdatedSellers
      );

      // Notify parent component
      onSellerSaved?.(newSellerFormValues);

      // Close dialog
      onClose(false);

      // Reset form
      form.reset();
    } catch (error) {
      console.error("Failed to save seller:", error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5">
        <DialogHeader className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <DialogTitle className="text-base">
            {isEditMode ? "Edit Seller" : "Add New Seller"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Edit the seller details"
              : "Add a new seller to use later in your invoices"}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              id={SELLER_FORM_ID}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Enter seller name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Enter seller address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="seller@email.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* VAT Number */}
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <FormField
                    control={form.control}
                    name="vatNo"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter VAT number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Show/Hide VAT Number Field in PDF */}
                  <div className="ml-4 flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="vatNoFieldIsVisible"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <CustomTooltip
                              trigger={<Label>Show in PDF</Label>}
                              content='Show/Hide the "VAT Number" field in the PDF'
                              className="z-[1000]"
                            />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Enter account number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="ml-4 flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="accountNumberFieldIsVisible"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <CustomTooltip
                              trigger={<Label>Show in PDF</Label>}
                              content='Show/Hide the "Account Number" field in the PDF'
                              className="z-[1000]"
                            />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* SWIFT/BIC */}
                <div className="flex items-end justify-between">
                  <FormField
                    control={form.control}
                    name="swiftBic"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>SWIFT/BIC</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Enter SWIFT/BIC code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Show/Hide SWIFT/BIC Field in PDF */}
                  <div className="ml-4 flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="swiftBicFieldIsVisible"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <CustomTooltip
                              trigger={<Label>Show in PDF</Label>}
                              content='Show/Hide the "SWIFT/BIC" field in the PDF'
                              className="z-[1000]"
                            />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="border-border border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" _variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form={SELLER_FORM_ID}>
            Save Seller
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
