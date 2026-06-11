import type { ChangeEventHandler } from "react";
import type { FlagFilter } from "../../types";
import type { SortCategory, SortDirection } from "../../hooks/useSortFlag";

export interface ToolBarFilters {
  search: string;
  setSearch: (value: string) => void;
  filter: FlagFilter;
  setFilter: (filter: string) => void;
  counts: Record<FlagFilter, number>;
}

export interface ToolBarSort {
  category: SortCategory;
  direction: SortDirection;
  cycleCategory: () => void;
  toggleDirection: () => void;
}

export interface ToolBarActions {
  clearAllOverrides: () => void;
  exportOverrides: () => void;
  importOverrides: () => void;
}

export interface ToolBarInput {
  readonly filters: ToolBarFilters;
  readonly sort: ToolBarSort;
  readonly actions: ToolBarActions;
}

export interface FilterOption {
  readonly value: FlagFilter;
  readonly label: string;
  readonly labelShort: string;
  readonly count: number;
}

export interface ToolBarViewProps {
  readonly search: string;
  readonly onSearchChange: ChangeEventHandler<HTMLInputElement>;
  readonly filter: FlagFilter;
  readonly onFilterChange: (value: string) => void;
  readonly filterOptions: FilterOption[];
  readonly sortLabel: string;
  readonly sortDirection: SortDirection;
  readonly onCycleCategory: () => void;
  readonly onToggleDirection: () => void;
  readonly onExport: () => void;
  readonly onImport: () => void;
  readonly onClearAll: () => void;
}
