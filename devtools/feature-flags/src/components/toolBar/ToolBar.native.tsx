import { Box, Divider } from "@ledgerhq/lumen-ui-rnative";
import type { FlagFilter } from "../../types";
import type { SortCategory, SortDirection } from "../../hooks";
import { SearchFlag } from "../searchFlag/SearchFlag.native";
import { FilterFlagControl } from "../filterFlagControl/FilterFlagControl.native";
import { FlagCountIndicator } from "../flagCountIndicator/FlagCountIndicator.native";
import { SortButton } from "../SortButton/SortButton.native";

export interface ToolBarProps {
  readonly search: string;
  readonly setSearch: (search: string) => void;
  readonly filter: FlagFilter;
  readonly setFilter: (filter: string) => void;
  readonly counts: Record<FlagFilter, number>;
  readonly filteredCount: number;
  readonly category: SortCategory;
  readonly direction: SortDirection;
  readonly setSort: (category: SortCategory, direction: SortDirection) => void;
}

export function ToolBar({
  search,
  setSearch,
  filter,
  setFilter,
  counts,
  filteredCount,
  category,
  direction,
  setSort,
}: ToolBarProps) {
  return (
    <Box lx={{ padding: "s16", gap: "s16" }}>
      <SearchFlag search={search} setSearch={setSearch} />
      <FilterFlagControl filter={filter} setFilter={setFilter} />
      <Box
        lx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "s4",
        }}
      >
        <Box lx={{ flexShrink: 1 }}>
          <FlagCountIndicator filteredCount={filteredCount} counts={counts} />
        </Box>
        <SortButton category={category} direction={direction} setSort={setSort} />
      </Box>
      <Divider />
    </Box>
  );
}
