import React from "react";
import type { ChartSectionHeaderInput } from "../types";
import { ChartSectionHeaderView } from "./ChartSectionHeaderView";
import { useChartSectionHeaderViewModel } from "./useChartSectionHeaderViewModel";

export function ChartSectionHeader(props: ChartSectionHeaderInput) {
  const viewModel = useChartSectionHeaderViewModel(props);
  return <ChartSectionHeaderView viewModel={viewModel} />;
}
