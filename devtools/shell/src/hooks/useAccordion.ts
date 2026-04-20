import { useCallback, useState } from "react";

type AccordionOptions = {
  mode?: "single" | "multi";
};

export const useAccordion = <T>({ mode = "single" }: AccordionOptions = {}) => {
  const [expanded, setExpanded] = useState<Set<T>>(new Set());

  const toggle = useCallback(
    (key: T) => {
      setExpanded(prev => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          if (mode === "single") {
            next.clear();
          }
          next.add(key);
        }
        return next;
      });
    },
    [mode],
  );

  const isExpanded = useCallback((key: T) => expanded.has(key), [expanded]);

  return { isExpanded, toggle };
};
