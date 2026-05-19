import { useMemo, useState } from "react";
import type { FeatureId, Features, PartialFeatures } from "@shared/feature-flags";
import type { FlagFilter } from "../types";
import { ALL_FLAG_IDS } from "../constants";

export interface FeatureFlagsFiltersInput {
  resolved: Features;
  overrides: PartialFeatures;
}

export interface FeatureFlagsFiltersState {
  search: string;
  setSearch: (value: string) => void;
  filter: FlagFilter;
  setFilter: (filter: FlagFilter) => void;
  filteredFlagIds: FeatureId[];
}

export function useFeatureFlagsFilters({
  resolved,
  overrides,
}: FeatureFlagsFiltersInput): FeatureFlagsFiltersState {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FlagFilter>("all");

  const sortedFlagIds = useMemo(() => [...ALL_FLAG_IDS].sort(), []);

  const filteredFlagIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchesFilter: Record<FlagFilter, (id: FeatureId) => boolean> = {
      all: () => true,
      enabled: id => resolved[id].enabled,
      disabled: id => !resolved[id].enabled,
      overridden: id => !!overrides[id],
    };
    return sortedFlagIds.filter(
      id => (!q || id.toLowerCase().includes(q)) && matchesFilter[filter](id),
    );
  }, [search, filter, resolved, overrides, sortedFlagIds]);

  return { search, setSearch, filter, setFilter, filteredFlagIds };
}
