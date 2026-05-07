import React from "react";
import { MarketStatsView } from "./MarketStatsView";
import { useMarketStatsViewModel } from "./hooks/useMarketStatsViewModel";

export function MarketStats() {
  const viewModel = useMarketStatsViewModel();
  return <MarketStatsView {...viewModel} />;
}
