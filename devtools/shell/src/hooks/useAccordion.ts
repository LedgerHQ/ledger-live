import { useCallback, useState } from "react";

type AccordionOptions = {
  mode?: "single" | "multi";
};

export const useAccordion = <T>({ mode = "single" }: AccordionOptions = {}) => {
  const [expanded, setExpanded] = useState<Set<T>>(new Set());

  const openKey = useCallback(
    (prev: Set<T>, key: T): Set<T> => {
      if (prev.has(key)) return prev;
      return mode === "single" ? new Set<T>([key]) : new Set(prev).add(key);
    },
    [mode],
  );

  const expand = useCallback((key: T) => setExpanded(prev => openKey(prev, key)), [openKey]);

  const toggle = useCallback(
    (key: T) => {
      setExpanded(prev => {
        if (prev.has(key)) {
          const next = new Set(prev);
          next.delete(key);
          return next;
        }
        return openKey(prev, key);
      });
    },
    [openKey],
  );

  const isExpanded = useCallback((key: T) => expanded.has(key), [expanded]);

  return { isExpanded, toggle, expand };
};
