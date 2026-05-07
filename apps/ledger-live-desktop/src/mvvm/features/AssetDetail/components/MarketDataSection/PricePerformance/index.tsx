import React from "react";
import { PricePerformanceView } from "./PricePerformanceView";
import { usePricePerformanceViewModel } from "./hooks/usePricePerformanceViewModel";

export function PricePerformance() {
  const viewModel = usePricePerformanceViewModel();
  return <PricePerformanceView {...viewModel} />;
}
