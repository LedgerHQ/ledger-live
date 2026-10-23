import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";

const RANGES = ["hour", "day", "week", "month", "year", "all"] as const;

/** How far back the balance history goes. */
export function RangeControl({
  range,
  setRange,
}: Readonly<Pick<AccountPortfolioViewModel, "range" | "setRange">>) {
  return (
    <SegmentedControl selectedValue={range} onSelectedChange={setRange} tabLayout="fit">
      {RANGES.map(value => (
        <SegmentedControlButton key={value} value={value}>
          {value}
        </SegmentedControlButton>
      ))}
    </SegmentedControl>
  );
}
