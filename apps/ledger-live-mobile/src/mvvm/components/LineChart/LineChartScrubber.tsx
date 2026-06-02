import React, { useCallback } from "react";
import {
  Scrubber,
  type ChartTooltipItemData,
  type ScrubberTooltipContent,
} from "@ledgerhq/lumen-ui-rnative-visualization";
import { buildTooltipRow } from "./utils/buildTooltipRow";
import { estimateTooltipMinWidth } from "./utils/estimateTooltipMinWidth";
import { resolveNearestPointTooltip } from "./utils/resolveNearestPointTooltip";
import type {
  LineChartPointTooltip,
  LineChartSeries,
  LineChartTooltipTitle,
  LineChartValueFormatter,
} from "./types";

type LineChartScrubberProps = Readonly<{
  series: LineChartSeries[];
  formatValue: LineChartValueFormatter;
  tooltipTitle?: LineChartTooltipTitle;
  /** Renders the floating tooltip. Beacons/line still render when false. @default true */
  showTooltip?: boolean;
  /** Renders the beacon dots on the scrubbed data point. @default true */
  showBeacons?: boolean;
  /** Tooltip content keyed by data index, consulted when `pointTooltipsOnly` is set. */
  pointTooltips?: ReadonlyMap<number, LineChartPointTooltip>;
  /**
   * Restricts the tooltip to `pointTooltips`: it appears only when the scrubbed index
   * resolves to a marker, and the standard per-series value tooltip is suppressed.
   * @default false
   */
  pointTooltipsOnly?: boolean;
}>;

export function LineChartScrubber({
  series,
  formatValue,
  tooltipTitle,
  showTooltip = true,
  showBeacons = true,
  pointTooltips,
  pointTooltipsOnly = false,
}: LineChartScrubberProps) {
  const buildTooltip = useCallback(
    (dataIndex: number): ScrubberTooltipContent => {
      // In point-only mode the scrubber surfaces a tooltip exclusively on marked data
      // points (e.g. transactions); every other index is hidden. The scrubber snaps to
      // the nearest data index, which may differ from a marker's exact index (notably on
      // dense ranges where several data points share a pixel), so we resolve the nearest
      // marker within a density-aware tolerance rather than an exact match.
      if (pointTooltipsOnly) {
        const pointTooltip = pointTooltips
          ? resolveNearestPointTooltip(pointTooltips, dataIndex, series[0]?.data?.length ?? 0)
          : undefined;
        if (!pointTooltip) return { items: [] };

        const items = [...pointTooltip.rows];
        // Pin a content-derived width floor so the right-aligned value never
        // overlaps the label when the tooltip's async measurement is stale.
        const minWidth = estimateTooltipMinWidth(pointTooltip);
        return pointTooltip.title != null && pointTooltip.title !== ""
          ? { items, title: pointTooltip.title, minWidth }
          : { items, minWidth };
      }

      const items = series
        .map(entry => buildTooltipRow(entry, dataIndex, formatValue))
        .filter((row): row is ChartTooltipItemData => row !== null);

      const title = tooltipTitle?.(dataIndex);
      const minWidth = estimateTooltipMinWidth({
        title: title != null && title !== "" ? title : undefined,
        rows: items.map(item => ({ label: String(item.label), value: String(item.value) })),
      });

      return title != null && title !== "" ? { items, title, minWidth } : { items, minWidth };
    },
    [series, formatValue, tooltipTitle, pointTooltips, pointTooltipsOnly],
  );

  return <Scrubber showBeacons={showBeacons} tooltip={showTooltip ? buildTooltip : undefined} />;
}
