import React from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  success: CheckCircle2,
  danger: XCircle,
  info: Info,
};

const TONE_CLASSES = {
  success: "border-success-600/20 text-success-700",
  danger: "border-danger-600/20 text-danger-700",
  info: "border-accent-600/20 text-accent-700",
};

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
      aria-live="polite"
      role="status"
    >
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone] || ICONS.info;
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white/90 px-4 py-3",
              "shadow-glass backdrop-blur-md transition-all duration-200 ease-premium",
              "animate-toast-in",
              TONE_CLASSES[toast.tone] || TONE_CLASSES.info
            )}
            onClick={() => onDismiss(toast.id)}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-navy-900/60">{toast.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
