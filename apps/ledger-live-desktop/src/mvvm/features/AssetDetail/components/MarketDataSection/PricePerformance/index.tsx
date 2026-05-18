import React from "react";
import type { MarketDataSectionCurrencyData } from "../hooks/useMarketDataSectionCurrencyData";
import { PricePerformanceView } from "./PricePerformanceView";
import { usePricePerformanceViewModel } from "./hooks/usePricePerformanceViewModel";

type PricePerformanceProps = Readonly<{
  currencyData: MarketDataSectionCurrencyData;
}>;

export function PricePerformance({ currencyData }: PricePerformanceProps) {
  const viewModel = usePricePerformanceViewModel(currencyData);
  return <PricePerformanceView {...viewModel} />;
}
