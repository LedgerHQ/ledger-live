import React from "react";
import { TIME_RANGE } from "@ledgerhq/live-common/market/constants";
import { getChangePercentage } from "@ledgerhq/live-common/market/utils/index";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { trendPercentageBody3Styles } from "LLD/shared/trendPercentageStyles";

type PerformanceIndicatorProps = {
  item: MarketItemPerformer;
};

export const PerformanceIndicator = ({ item }: PerformanceIndicatorProps) => {
  const change = getChangePercentage(item, TIME_RANGE);

  if (!Number.isFinite(change)) {
    return <div className={trendPercentageBody3Styles({ variant: "neutral" })}>—</div>;
  }

  const variant = change > 0 ? "positive" : change < 0 ? "negative" : "neutral";

  return (
    <div className={trendPercentageBody3Styles({ variant })}>
      {change >= 0 ? "+" : ""}
      {change.toFixed(2)}%
    </div>
  );
};
