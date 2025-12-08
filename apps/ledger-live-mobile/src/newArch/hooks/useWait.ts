import { type Dispatch, type SetStateAction, useRef, useState } from "react";

export function useWait<T>(
  fn: (resolve: Dispatch<SetStateAction<T | undefined>>) => void,
): T | undefined {
  const [value, setValue] = useState<T | undefined>();
  const called = useRef(false);
  if (!called.current) {
    called.current = true;
    fn(setValue);
  }
  return value;
}
