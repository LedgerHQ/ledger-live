import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-rnative";
import type { FlagFilter } from "../../types";

const FILTERS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Enabled", value: "enabled" },
  { label: "Disabled", value: "disabled" },
  { label: "Overridden", value: "overridden" },
];

export interface FilterFlagControlProps {
  readonly filter: FlagFilter;
  readonly setFilter: (filter: string) => void;
}

export function FilterFlagControl({ filter, setFilter }: FilterFlagControlProps) {
  return (
    <SegmentedControl selectedValue={filter} onSelectedChange={setFilter}>
      {FILTERS_OPTIONS.map(option => (
        <SegmentedControlButton key={option.value} value={option.value}>
          {option.label}
        </SegmentedControlButton>
      ))}
    </SegmentedControl>
  );
}
