import { useEffect, useState } from "react";

/** True once `active` has stayed true for `delayMs`; back to false as soon as it turns false or `restartKey` changes. */
export function useAfterDelay(active: boolean, delayMs: number, restartKey = 0): boolean {
  const [elapsedFor, setElapsedFor] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setElapsedFor(restartKey), delayMs);
    return () => {
      clearTimeout(timer);
      setElapsedFor(null);
    };
  }, [active, delayMs, restartKey]);

  return active && elapsedFor === restartKey;
}
