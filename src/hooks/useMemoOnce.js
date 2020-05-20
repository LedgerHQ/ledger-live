// @flow
import { useRef } from "react";

export default function useMemoOnce<T>(callback: () => T): T {
  const ref = useRef();

  if (!ref.current) {
    ref.current = callback();
  }

  return ref.current;
}
