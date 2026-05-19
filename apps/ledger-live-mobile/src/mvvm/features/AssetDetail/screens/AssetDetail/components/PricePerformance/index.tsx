import React from "react";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { usePricePerformanceViewModel } from "./usePricePerformanceViewModel";
import { PricePerformanceView } from "./PricePerformanceView";

export function PricePerformance({ currency }: Readonly<{ currency: AssetDetailCurrencyProps }>) {
  const viewModel = usePricePerformanceViewModel(currency);
  return <PricePerformanceView {...viewModel} />;
}
