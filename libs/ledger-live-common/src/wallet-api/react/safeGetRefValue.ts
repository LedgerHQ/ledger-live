import type { RefObject } from "react";

export function safeGetRefValue<T>(ref: RefObject<T>): NonNullable<T> {
  if (!ref.current) {
    throw new Error("Ref objects doesn't have a current value");
  }
  return ref.current;
}
