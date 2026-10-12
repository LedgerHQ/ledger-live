import { useEffect, useState } from "react";

/** True until `retryLockedUntil` (ms since epoch) passes; re-renders when it does. */
export function useSponsoredRetryLocked(retryLockedUntil: number | null): boolean {
  const [passedLock, setPassedLock] = useState<number | null>(null);

  useEffect(() => {
    if (retryLockedUntil === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const wake = () => {
      const remaining = retryLockedUntil - Date.now();
      // Checked again on wake: a timer can fire early.
      if (remaining > 0) timer = setTimeout(wake, remaining);
      else setPassedLock(retryLockedUntil);
    };
    timer = setTimeout(wake, Math.max(retryLockedUntil - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [retryLockedUntil]);

  return retryLockedUntil !== null && passedLock !== retryLockedUntil;
}
