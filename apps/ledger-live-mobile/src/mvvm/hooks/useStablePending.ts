import { useEffect, useRef, useState } from "react";

/**
 * Returns a stabilized version of a "pending" boolean that delays the transition
 * from true to false. Use when the raw pending flag toggles rapidly (e.g. during
 * a single poll) and you want to avoid UI flicker.
 *
 * - When pending becomes true → returns true immediately.
 * - When pending becomes false → returns false only after it has stayed false
 *   for `delayMs` (default 200ms). If pending goes true again before that, the
 *   delay is cancelled and the return value stays true.
 */
export function useStablePending(pending: boolean, delayMs: number = 200): boolean {
  const [stablePending, setStablePending] = useState(pending);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pending) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setStablePending(true);
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setStablePending(false);
    }, delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pending, delayMs]);

  return stablePending;
}
