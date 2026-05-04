import { useCallback, useState } from "react";

type AccordionOptions<T> = {
  mode?: "single" | "multi";
  openKey?: T | null;
};

export const useAccordion = <T>({ mode = "single", openKey }: AccordionOptions<T> = {}) => {
  const [expanded, setExpanded] = useState<Set<T>>(() =>
    openKey != null ? new Set([openKey]) : new Set<T>(),
  );
  const [prevOpenKey, setPrevOpenKey] = useState<T | null | undefined>(openKey);

  // When openKey changes, reset expanded to the new key during render
  // React re-renders immediately with the updated state before painting.
  if (prevOpenKey !== openKey) {
    setPrevOpenKey(openKey);
    setExpanded(openKey != null ? new Set([openKey]) : new Set<T>());
  }

  const buildOpenSet = useCallback(
    (prev: Set<T>, key: T): Set<T> => {
      if (prev.has(key)) return prev;
      return mode === "single" ? new Set<T>([key]) : new Set(prev).add(key);
    },
    [mode],
  );

  const toggle = useCallback(
    (key: T) => {
      setExpanded(prev => {
        if (prev.has(key)) {
          const next = new Set(prev);
          next.delete(key);
          return next;
        }
        return buildOpenSet(prev, key);
      });
    },
    [buildOpenSet],
  );

  const isExpanded = useCallback((key: T) => expanded.has(key), [expanded]);

  return { isExpanded, toggle };
};
