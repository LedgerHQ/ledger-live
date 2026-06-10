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
  setFilter: (filter: string) => void;
  filteredFlagIds: FeatureId[];
  counts: Record<FlagFilter, number>;
}

export const FILTERS: FlagFilter[] = ["all", "enabled", "disabled", "overridden"];

export function useFeatureFlagsFilters({
  resolved,
  overrides,
}: FeatureFlagsFiltersInput): FeatureFlagsFiltersState {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FlagFilter>("all");

  function setFilterAsString(value: string) {
    const match = FILTERS.find(f => f === value);
    if (match) {
      setFilter(match);
    } else {
      console.warn(`Invalid filter: ${value}`);
    }
  }

  const matchesFilter = useMemo<Record<FlagFilter, (id: FeatureId) => boolean>>(
    () => ({
      all: () => true,
      enabled: id => resolved[id].enabled,
      disabled: id => !resolved[id].enabled,
      overridden: id => !!overrides[id],
    }),
    [resolved, overrides],
  );

  const filteredFlagIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_FLAG_IDS.filter(
      id => (!q || id.toLowerCase().includes(q)) && matchesFilter[filter](id),
    );
  }, [search, filter, matchesFilter]);

  // Counts reflect totals across all flags, independent of the active search and filter.
  const counts = useMemo(() => {
    const acc: Record<FlagFilter, number> = {
      all: ALL_FLAG_IDS.length,
      enabled: 0,
      disabled: 0,
      overridden: 0,
    };
    for (const id of ALL_FLAG_IDS) {
      if (matchesFilter.enabled(id)) acc.enabled++;
      if (matchesFilter.disabled(id)) acc.disabled++;
      if (matchesFilter.overridden(id)) acc.overridden++;
    }
    return acc;
  }, [matchesFilter]);

  return { search, setSearch, filter, setFilter: setFilterAsString, filteredFlagIds, counts };
}
