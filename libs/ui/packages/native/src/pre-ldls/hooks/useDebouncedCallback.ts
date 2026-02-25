import { useEffect, useRef, useState } from "react";

export function useDebouncedCallback<T extends unknown[]>(
  callback: ((...args: T) => void) | undefined,
  delay?: number,
) {
  const [debouncedCallback, setDebouncedCallback] = useState<(...args: T) => void>();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!callback) return setDebouncedCallback(undefined);

    setDebouncedCallback(() => (...args: T) => {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => callback(...args), delay);
    });

    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [callback, delay]);

  return debouncedCallback;
}
