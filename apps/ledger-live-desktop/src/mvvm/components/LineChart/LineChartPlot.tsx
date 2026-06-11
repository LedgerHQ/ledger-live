import React from "react";
import { LineChartPlotContent, type LineChartPlotContentProps } from "./LineChartPlotContent";

export type LineChartPlotProps = LineChartPlotContentProps;

export function LineChartPlot(contentProps: LineChartPlotProps) {
  return (
    <div className="w-full min-w-0">
      <LineChartPlotContent {...contentProps} />
    </div>
  );
}
