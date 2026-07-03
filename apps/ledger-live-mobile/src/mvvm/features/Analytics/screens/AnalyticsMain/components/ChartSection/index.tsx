import React from "react";
import { ChartSectionView } from "./ChartSectionView";
import { useChartSectionViewModel } from "./useChartSectionViewModel";

export function ChartSection() {
  const viewModel = useChartSectionViewModel();
  return <ChartSectionView viewModel={viewModel} />;
}

export default React.memo(ChartSection);
