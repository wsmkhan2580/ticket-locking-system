import React from "react";
import { cn } from "@/lib/utils";

/**
 * Restrained glassmorphism card: subtle transparency + blur + soft border +
 * light shadow. Intentionally NOT stacked with gradients/heavy glow on every
 * instance — the brief asks for clarity first, decoration second.
 */
export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md",
      "shadow-glass-sm transition-shadow duration-200 ease-premium",
      "dark:border-white/10 dark:bg-navy-900/40",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";
