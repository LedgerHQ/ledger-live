import React from "react";
import type { MarketDataSectionCurrencyData } from "../hooks/useMarketDataSectionCurrencyData";
import { MarketStatsView } from "./MarketStatsView";
import { useMarketStatsViewModel } from "./hooks/useMarketStatsViewModel";

type MarketStatsProps = Readonly<{
  currencyData: MarketDataSectionCurrencyData;
}>;

export function MarketStats({ currencyData }: MarketStatsProps) {
  const viewModel = useMarketStatsViewModel(currencyData);
  return <MarketStatsView {...viewModel} />;
}
