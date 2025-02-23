import { cn } from "@/lib/utils";
import * as React from "react";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        autoComplete="off"
        className={cn(
          "h-8 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm shadow-black/5 transition-shadow placeholder:text-slate-500/70 focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-400/70 dark:focus-visible:border-slate-300 dark:focus-visible:ring-slate-300/20",
          type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          type === "file" &&
            "p-0 pr-3 italic text-slate-500/70 file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-slate-200 file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic file:text-slate-950 dark:text-slate-400/70 dark:file:border-slate-800 dark:file:text-slate-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
