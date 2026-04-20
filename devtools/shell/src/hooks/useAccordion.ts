import { useCallback, useState } from "react";

export const useAccordion = <T>() => {
  const [expanded, setExpanded] = useState<Set<T>>(new Set());

  const toggle = useCallback((key: T) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback((key: T) => expanded.has(key), [expanded]);

  return { isExpanded, toggle };
};
