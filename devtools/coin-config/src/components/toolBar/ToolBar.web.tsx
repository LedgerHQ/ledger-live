import {
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  SearchInput,
  SegmentedControl,
  SegmentedControlButton,
} from "@ledgerhq/lumen-ui-react";
import { MoreHorizontal } from "@ledgerhq/lumen-ui-react/symbols";
import type { KeyFilter } from "../../types";
import { FILTER_LABELS } from "../../coin-config/internals/filters";
import { Pill } from "../pill/Pill";

export interface ToolBarProps {
  readonly search: string;
  readonly setSearch: (search: string) => void;
  readonly filter: KeyFilter;
  readonly setFilter: (filter: string) => void;
  readonly filterOptions: readonly { value: KeyFilter; count: number }[];
  readonly onClearAll: () => void;
}

export function ToolBar({
  search,
  setSearch,
  filter,
  setFilter,
  filterOptions,
  onClearAll,
}: ToolBarProps) {
  return (
    <div className="flex flex-col gap-16 p-16 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center justify-between gap-16 xl:contents">
        <SearchInput
          className="max-xl:min-w-0 max-xl:flex-1"
          placeholder="Search config keys..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <div className="xl:order-3">
          <Menu>
            <MenuTrigger
              render={
                <IconButton
                  aria-label="Actions"
                  size="sm"
                  appearance="gray"
                  icon={MoreHorizontal}
                />
              }
            />
            <MenuContent align="end">
              <MenuItem onClick={onClearAll}>Reset all overrides</MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>
      <SegmentedControl
        className="self-start xl:order-2 xl:self-center"
        selectedValue={filter}
        onSelectedChange={setFilter}
        tabLayout="fit"
      >
        {filterOptions.map(option => (
          <SegmentedControlButton
            key={option.value}
            value={option.value}
            className="flex items-center gap-4 px-8 sm:px-16"
          >
            <div className="flex items-center gap-4 hover:text-muted-hover">
              <span>{FILTER_LABELS[option.value]}</span>
              <span className="max-sm:hidden">
                <Pill variant={filter === option.value ? "black" : "muted"}>{option.count}</Pill>
              </span>
            </div>
          </SegmentedControlButton>
        ))}
      </SegmentedControl>
    </div>
  );
}
