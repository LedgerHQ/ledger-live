import {
  SearchInput,
  SegmentedControl,
  SegmentedControlButton,
  Button,
  InteractiveIcon,
  Menu,
  MenuTrigger,
  IconButton,
  MenuContent,
  MenuItem,
} from "@ledgerhq/lumen-ui-react";
import { Pill } from "../pill/Pill.web";
import { FilterSort, ArrowUp, ArrowDown, MoreHorizontal } from "@ledgerhq/lumen-ui-react/symbols";
import { useToolBarViewModel } from "./useToolBarViewModel.web";
import type { ToolBarInput, ToolBarViewProps } from "./types.web";

function ToolBarView({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  filterOptions,
  sortLabel,
  sortDirection,
  onCycleCategory,
  onToggleDirection,
  onExport,
  onImport,
  onClearAll,
}: ToolBarViewProps) {
  return (
    <div className="flex flex-col gap-16 p-16 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center justify-between gap-16 lg:contents">
        <SearchInput
          // max-lg:flex-1 + min-w-0 lets the input shrink (be "crushed") instead of pushing
          // the menu to the next line when the row wraps below lg. At lg the row never wraps,
          // so we leave its sizing alone.
          className="order-1 max-lg:min-w-0 max-lg:flex-1"
          placeholder="Search flags..."
          value={search}
          onChange={onSearchChange}
        />
        <div className="flex items-center gap-4 order-3 max-sm:basis-full sm:order-2 lg:order-3">
          <Button appearance="no-background" size="sm" icon={FilterSort} onClick={onCycleCategory}>
            {sortLabel}
          </Button>
          <InteractiveIcon
            iconType="stroked"
            icon={sortDirection === "asc" ? ArrowUp : ArrowDown}
            size={32}
            aria-label={sortDirection === "asc" ? "Sort ascending" : "Sort descending"}
            onClick={onToggleDirection}
          />
        </div>
        <div className="order-2 sm:order-3 lg:order-4">
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
              <MenuItem onClick={onExport}>Export flags</MenuItem>
              <MenuItem onClick={onImport}>Import flags</MenuItem>
              <MenuItem onClick={onClearAll}>Reset all overrides</MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>
      <SegmentedControl
        className="self-start lg:order-2 lg:self-center"
        selectedValue={filter}
        onSelectedChange={onFilterChange}
        tabLayout="fit"
      >
        {filterOptions.map(option => (
          <SegmentedControlButton
            key={option.value}
            value={option.value}
            className="flex items-center gap-4 px-8 sm:px-16"
          >
            <div className={"flex items-center gap-4 hover:text-muted-hover"}>
              <span className="lg:hidden">{option.labelShort}</span>
              <span className="max-lg:hidden">{option.label}</span>
              {/* Counts are dropped below sm to keep the control from overflowing the panel. */}
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

export function ToolBar(props: ToolBarInput) {
  return <ToolBarView {...useToolBarViewModel(props)} />;
}
