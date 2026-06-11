import React from "react";
import {
  useChartOptionsMenuViewModel,
  type UseChartOptionsMenuViewModelProps,
} from "./useChartOptionsMenuViewModel";
import { ChartOptionsMenuView } from "./ChartOptionsMenuView";

export function ChartOptionsMenu(props: UseChartOptionsMenuViewModelProps) {
  const viewModel = useChartOptionsMenuViewModel(props);
  return <ChartOptionsMenuView viewModel={viewModel} />;
}
