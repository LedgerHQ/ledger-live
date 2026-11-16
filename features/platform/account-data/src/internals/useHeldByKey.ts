import { useState } from "react";

/** Holds the value first seen for `key` in state, so a discarded render cannot replace it. */
export function useHeldByKey<T>(value: T, key: string | undefined): T {
  const [held, setHeld] = useState({ key, value });
  if (held.key === key) return held.value;
  setHeld({ key, value });
  return value;
}
