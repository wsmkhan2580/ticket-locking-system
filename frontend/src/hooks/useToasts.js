import { useCallback, useRef, useState } from "react";

let idCounter = 0;

/**
 * Minimal toast queue. Each toast auto-dismisses after `duration` ms.
 * Kept intentionally small — this is an optional Sprint 1/2 enhancement,
 * not a mandatory feature, so it stays out of the way of the core locking
 * logic.
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, duration: 3200, ...toast }]);
      const timer = setTimeout(() => dismiss(id), toast.duration ?? 3200);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return { toasts, push, dismiss };
}
