import { useMemo } from "react";
import type { FlagFilter } from "../../types";
import { FILTERS } from "../../hooks/useFeatureFlagsFilters";
import type { SortCategory, SortDirection } from "../../hooks/useSortFlag";
import type { FilterOption, ToolBarInput, ToolBarViewProps } from "./types.web";

const FILTER_LABELS: Record<FlagFilter, string> = {
  all: "All",
  enabled: "On",
  disabled: "Off",
  overridden: "Overridden",
};

const FILTER_LABELS_SHORT: Record<FlagFilter, string> = {
  all: "All",
  enabled: "On",
  disabled: "Off",
  overridden: "Over",
};

const SORT_CATEGORY_LABELS: Record<SortCategory, (direction: SortDirection) => string> = {
  name: direction => (direction === "asc" ? "A→Z" : "Z→A"),
  overridden: direction => (direction === "asc" ? "Overridden first" : "Overriden last"),
  enabled: direction => (direction === "asc" ? "Enabled first" : "Enabled last"),
};

export function useToolBarViewModel({ filters, sort, actions }: ToolBarInput): ToolBarViewProps {
  const { search, setSearch, filter, setFilter, counts } = filters;
  const { category, direction, cycleCategory, toggleDirection } = sort;
  const { clearAllOverrides, exportOverrides, importOverrides } = actions;

  const filterOptions = useMemo<FilterOption[]>(
    () =>
      FILTERS.map(value => ({
        value,
        label: FILTER_LABELS[value],
        labelShort: FILTER_LABELS_SHORT[value],
        count: counts[value],
      })),
    [counts],
  );

  return {
    search,
    onSearchChange: e => setSearch(e.target.value),
    filter,
    onFilterChange: value => setFilter(value),
    filterOptions,
    sortLabel: SORT_CATEGORY_LABELS[category](direction),
    sortDirection: direction,
    onCycleCategory: cycleCategory,
    onToggleDirection: toggleDirection,
    onExport: exportOverrides,
    onImport: importOverrides,
    onClearAll: clearAllOverrides,
  };
}
