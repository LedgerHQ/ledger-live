import { useState, useEffect, useRef } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    clearTimeout(timeoutRef.current!);
    timeoutRef.current = setTimeout(() => setDebouncedValue(value), delay);

    // Cleanup function
    return () => {
      clearTimeout(timeoutRef.current!);
    };
  }, [value, delay]);

  return debouncedValue;
}
