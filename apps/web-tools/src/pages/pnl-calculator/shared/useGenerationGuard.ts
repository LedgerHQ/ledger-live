import { useCallback, useRef } from "react";

export type GenerationGuard = {
  next: () => number;
  isStale: (token: number) => boolean;
  cancel: () => void;
};

export function useGenerationGuard(): GenerationGuard {
  const ref = useRef(0);

  const next = useCallback(() => {
    ref.current += 1;
    return ref.current;
  }, []);

  const isStale = useCallback((token: number) => ref.current !== token, []);

  const cancel = useCallback(() => {
    ref.current += 1;
  }, []);

  return { next, isStale, cancel };
}
