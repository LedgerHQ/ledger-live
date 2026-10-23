import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";

export function TabBar({
  tab,
  setTab,
  historyCount,
}: Readonly<Pick<AccountPortfolioViewModel, "tab" | "setTab"> & { historyCount: number }>) {
  return (
    <SegmentedControl selectedValue={tab} onSelectedChange={setTab} tabLayout="fit">
      <SegmentedControlButton value="portfolio">Portfolio</SegmentedControlButton>
      <SegmentedControlButton value="read">Read</SegmentedControlButton>
      <SegmentedControlButton value="networks">Networks</SegmentedControlButton>
      <SegmentedControlButton value="write">Write</SegmentedControlButton>
      <SegmentedControlButton value="results">Results</SegmentedControlButton>
      <SegmentedControlButton value="history">
        {historyCount > 0 ? `History (${historyCount})` : "History"}
      </SegmentedControlButton>
    </SegmentedControl>
  );
}
