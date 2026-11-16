import {
  Box,
  Divider,
  SearchInput,
  SegmentedControl,
  SegmentedControlButton,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { KeyFilter } from "../../types";
import { FILTER_LABELS } from "../../coin-config/internals/filters";
import { ActionsMenu } from "../actionsMenu/ActionsMenu";
import { Pill } from "../pill/Pill";

export interface ToolBarProps {
  readonly search: string;
  readonly setSearch: (search: string) => void;
  readonly filter: KeyFilter;
  readonly setFilter: (filter: string) => void;
  readonly filterOptions: readonly { value: KeyFilter; count: number }[];
  readonly filteredCount: number;
  readonly totalCount: number;
  readonly overrideCount: number;
  readonly onClearAll: () => void;
}

export function ToolBar({
  search,
  setSearch,
  filter,
  setFilter,
  filterOptions,
  filteredCount,
  totalCount,
  overrideCount,
  onClearAll,
}: ToolBarProps) {
  return (
    <Box lx={{ paddingHorizontal: "s12", paddingVertical: "s16", gap: "s16" }}>
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
        <Box lx={{ flex: 1 }}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search config keys..."
          />
        </Box>
        <ActionsMenu onClearAll={onClearAll} />
      </Box>
      <SegmentedControl selectedValue={filter} onSelectedChange={setFilter}>
        {filterOptions.map(option => (
          <SegmentedControlButton key={option.value} value={option.value}>
            {`${FILTER_LABELS[option.value]} ${option.count}`}
          </SegmentedControlButton>
        ))}
      </SegmentedControl>
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
        <Text typography="body2" lx={{ color: "base" }}>
          {filteredCount} of {totalCount}
        </Text>
        {overrideCount > 0 && (
          <>
            <Text typography="body2" lx={{ color: "base" }}>
              ·
            </Text>
            <Pill variant="active">
              <Text typography="body2" lx={{ color: "active" }}>
                {overrideCount} overridden
              </Text>
            </Pill>
          </>
        )}
      </Box>
      <Divider />
    </Box>
  );
}
