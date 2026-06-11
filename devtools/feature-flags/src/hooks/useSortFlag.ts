import type { FeatureId, Features, PartialFeatures } from "@shared/feature-flags";
import { useCallback, useMemo, useState } from "react";

export const SORT_CATEGORIES = ["name", "overridden", "enabled"] as const;
export type SortCategory = (typeof SORT_CATEGORIES)[number];

export type SortDirection = "asc" | "desc";

export interface SortFlagState {
  sortedFlagIds: FeatureId[];
  category: SortCategory;
  direction: SortDirection;
  setSort: (category: SortCategory, direction: SortDirection) => void;
  toggleDirection: () => void;
  /** Steps to the next category: name → overridden → enabled → name. */
  cycleCategory: () => void;
}

export interface SortFlagProps {
  flagIds: FeatureId[];
  resolved: Features;
  overrides: PartialFeatures;
}

export function useSortFlag({ flagIds, resolved, overrides }: SortFlagProps): SortFlagState {
  const [category, setCategory] = useState<SortCategory>("name");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const setSort = useCallback((category: SortCategory, direction: SortDirection) => {
    setCategory(category);
    setDirection(direction);
  }, []);

  const toggleDirection = useCallback(() => {
    setDirection(prev => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const cycleCategory = useCallback(() => {
    setCategory(
      prev => SORT_CATEGORIES[(SORT_CATEGORIES.indexOf(prev) + 1) % SORT_CATEGORIES.length],
    );
  }, []);

  const sortedFlagIds = useMemo(() => {
    const comparators: Record<SortCategory, (a: FeatureId, b: FeatureId) => number> = {
      name: (a, b) => a.localeCompare(b),
      overridden: (a, b) => Number(!!overrides[b]) - Number(!!overrides[a]) || a.localeCompare(b),
      enabled: (a, b) =>
        Number(resolved[b].enabled) - Number(resolved[a].enabled) || a.localeCompare(b),
    };

    const base = comparators[category];
    const compare = direction === "asc" ? base : (a: FeatureId, b: FeatureId) => base(b, a);

    return [...flagIds].sort(compare);
  }, [flagIds, category, direction, resolved, overrides]);

  return {
    sortedFlagIds,
    category,
    direction,
    setSort,
    toggleDirection,
    cycleCategory,
  };
}
