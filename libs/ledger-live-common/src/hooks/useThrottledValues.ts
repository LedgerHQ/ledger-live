import { useEffect, useRef, useState } from "react";

export function useThrottledValues<T extends unknown[]>(values: T, throttleMs: number): T {
  const [throttled, setThrottled] = useState(values);
  const lastUpdate = useRef(Date.now());
  useEffect(() => {
    if (values.every((v, i) => v === throttled[i])) return;
    const timeout = setTimeout(
      () => {
        lastUpdate.current = Date.now();
        setThrottled(values);
      },
      Math.max(0, lastUpdate.current + throttleMs - Date.now()),
    );
    return () => clearTimeout(timeout);
  }, [...values, throttleMs]); // eslint-disable-line react-hooks/exhaustive-deps
  return throttled;
}
