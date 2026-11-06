import React from "react";
import { ChartSectionView } from "../ChartSection/ChartSectionView";
import {
  useScopedChartSectionViewModel,
  type ScopedChartSectionProps,
} from "./useScopedChartSectionViewModel";

export function ScopedChartSection(props: ScopedChartSectionProps) {
  return <ChartSectionView {...useScopedChartSectionViewModel(props)} />;
}
