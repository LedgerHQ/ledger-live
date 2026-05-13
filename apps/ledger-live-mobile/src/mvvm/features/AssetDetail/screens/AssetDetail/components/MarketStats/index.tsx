import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useMarketStatsViewModel } from "./useMarketStatsViewModel";
import { MarketStatsView } from "./MarketStatsView";

export function MarketStats({ currency }: Readonly<{ currency: AssetDetailCurrencyProps }>) {
  const viewModel = useMarketStatsViewModel(currency);
  return <MarketStatsView {...viewModel} />;
}
