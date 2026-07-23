import type { FeatureId } from "@shared/feature-flags";
import type { FeatureFlagsToolProps } from "../../types";
import { useFeatureFlagsFilters, useSortFlag } from "../../hooks";
import type { ToolBarProps } from "../toolBar/ToolBar";

export interface FlagListViewProps {
  readonly toolBarProps: ToolBarProps;
  readonly sortedFlagIds: FeatureId[];
}

export function useFlagListViewModel(props: FeatureFlagsToolProps): FlagListViewProps {
  const { resolved, overrides } = props;

  const { search, setSearch, filter, setFilter, filteredFlagIds, counts } = useFeatureFlagsFilters({
    resolved,
    overrides,
  });

  const { sortedFlagIds, category, direction, setSort } = useSortFlag({
    flagIds: filteredFlagIds,
    resolved,
    overrides,
  });

  return {
    toolBarProps: {
      search,
      setSearch,
      filter,
      setFilter,
      counts,
      filteredCount: filteredFlagIds.length,
      category,
      direction,
      setSort,
    },
    sortedFlagIds,
  };
}
