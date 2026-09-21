import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard shadcn-style class combiner: merges conditional clsx classes and
 * resolves conflicting Tailwind utilities (e.g. "p-2 p-4" -> "p-4").
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
