import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";
import type { AccountPortfolioViewModel } from "../../account-portfolio/viewModelTypes";

export function TabBar({
  tab,
  setTab,
  historyCount,
}: Readonly<Pick<AccountPortfolioViewModel, "tab" | "setTab"> & { historyCount: number }>) {
  return (
    <SegmentedControl selectedValue={tab} onSelectedChange={setTab} tabLayout="fit">
      <SegmentedControlButton value="portfolio">Portfolio</SegmentedControlButton>
      <SegmentedControlButton value="read">Read</SegmentedControlButton>
      <SegmentedControlButton value="results">Results</SegmentedControlButton>
      <SegmentedControlButton value="history">
        {historyCount > 0 ? `History (${historyCount})` : "History"}
      </SegmentedControlButton>
    </SegmentedControl>
  );
}
