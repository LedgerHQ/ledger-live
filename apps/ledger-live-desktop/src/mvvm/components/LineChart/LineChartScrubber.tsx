import React, { useCallback } from "react";
import {
  Scrubber,
  type ChartTooltipItemData,
  type ScrubberTooltipContent,
} from "@ledgerhq/lumen-ui-react-visualization";
import { buildTooltipRow } from "./utils/buildTooltipRow";
import type { LineChartSeries, LineChartTooltipTitle, LineChartValueFormatter } from "./types";

type LineChartScrubberProps = Readonly<{
  series: LineChartSeries[];
  formatValue: LineChartValueFormatter;
  tooltipTitle?: LineChartTooltipTitle;
}>;

export function LineChartScrubber({ series, formatValue, tooltipTitle }: LineChartScrubberProps) {
  const buildTooltip = useCallback(
    (dataIndex: number): ScrubberTooltipContent => {
      const items = series
        .map(entry => buildTooltipRow(entry, dataIndex, formatValue))
        .filter((row): row is ChartTooltipItemData => row !== null);

      const title = tooltipTitle?.(dataIndex);

      return title != null && title !== "" ? { items, title } : { items };
    },
    [series, formatValue, tooltipTitle],
  );

  return <Scrubber showBeacons tooltip={buildTooltip} />;
}
