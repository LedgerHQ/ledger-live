import React from "react";
import { ChartSectionHeaderView } from "./ChartSectionHeaderView";
import type { ChartSectionHeaderViewModel } from "./types";

export type { ChartSectionHeaderViewModel } from "./types";

type ChartSectionHeaderProps = Readonly<{
  viewModel: ChartSectionHeaderViewModel;
}>;

export function ChartSectionHeader({ viewModel }: ChartSectionHeaderProps) {
  return <ChartSectionHeaderView viewModel={viewModel} />;
}
