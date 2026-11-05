import { useLayoutEffect, useRef } from "react";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
