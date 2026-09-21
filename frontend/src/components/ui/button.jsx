import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium " +
    "transition-all duration-200 ease-premium focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none " +
    "disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-accent-600 text-white shadow-glass-sm hover:bg-accent-700 focus-visible:ring-accent-400",
        success:
          "bg-success-600 text-white shadow-glass-sm hover:bg-success-700 focus-visible:ring-success-600",
        danger:
          "bg-danger-600 text-white shadow-glass-sm hover:bg-danger-700 focus-visible:ring-danger-600",
        outline:
          "border border-navy-900/10 bg-white/50 text-navy-900 hover:bg-white/80 focus-visible:ring-navy-400",
        ghost: "text-navy-900/70 hover:bg-navy-900/5 hover:text-navy-900",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
