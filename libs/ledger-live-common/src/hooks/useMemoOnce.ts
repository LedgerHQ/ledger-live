import { useRef } from "react";
export default function useMemoOnce<T>(callback: () => T): T {
  const ref = useRef<T>();

  if (!ref.current) {
    ref.current = callback();
  }

  return ref.current;
}
