import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 ease-premium",
  {
    variants: {
      variant: {
        neutral: "bg-navy-900/5 text-navy-900/70",
        success: "bg-success-50 text-success-700",
        danger: "bg-danger-50 text-danger-700",
        accent: "bg-accent-50 text-accent-700",
        priorityHigh: "bg-danger-50 text-danger-700",
        priorityMedium: "bg-accent-50 text-accent-700",
        priorityLow: "bg-navy-900/5 text-navy-900/60",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
