import { useEffect, useRef, useState } from "react";

export function useDebouncedCallback<T extends unknown[]>(
  callback: ((...args: T) => void) | undefined,
  delay?: number,
) {
  const [debouncedCallback, setDebouncedCallback] = useState<(...args: T) => void>();
  const timeout = useRef<number>(3000);

  useEffect(() => {
    if (!callback) return setDebouncedCallback(undefined);

    setDebouncedCallback(() => (...args: T) => {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => callback(...args), delay);
    });

    return () => clearTimeout(timeout.current);
  }, [callback, delay]);

  return debouncedCallback;
}
