"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "block text-balance text-xs font-medium text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-50",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
