import React from "react";
import { ChartSection } from "../ChartSection";
import {
  useAnalyticsBalanceRendererViewModel,
  type AnalyticsBalanceRendererProps,
} from "./useAnalyticsBalanceRendererViewModel";

export function AnalyticsBalanceRenderer(props: AnalyticsBalanceRendererProps) {
  return (
    <div data-testid="analytics-chart">
      <ChartSection {...useAnalyticsBalanceRendererViewModel(props)} />
    </div>
  );
}
