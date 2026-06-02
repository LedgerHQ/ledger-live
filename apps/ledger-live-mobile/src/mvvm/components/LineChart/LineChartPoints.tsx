import React from "react";
import { Point } from "@ledgerhq/lumen-ui-rnative-visualization";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { LINE_CHART_POINT_SIZE } from "./constants";
import { resolveMarkerColor } from "./utils/resolveMarkerColor";
import type { LineChartPointMarker, LineChartValueFormatter } from "./types";

type LineChartPointsProps = Readonly<{
  points: LineChartPointMarker[];
  formatValue: LineChartValueFormatter;
}>;

export function LineChartPoints({ points, formatValue }: LineChartPointsProps) {
  const { theme } = useTheme();

  if (points.length === 0) return null;

  return (
    <>
      {points.map(marker => (
        <Point
          // `hidePoint`/`color` discriminate markers that share an index, value and
          // label position (e.g. a transaction dot landing on a min/max marker).
          key={`${marker.index}-${marker.value}-${marker.labelPosition ?? "top"}-${
            marker.hidePoint ? "h" : "v"
          }-${marker.color ?? ""}`}
          dataX={marker.index}
          dataY={marker.value}
          label={marker.hideLabel ? undefined : marker.label ?? formatValue(marker.value)}
          labelPosition={marker.labelPosition ?? "top"}
          hidePoint={marker.hidePoint}
          size={LINE_CHART_POINT_SIZE}
          color={resolveMarkerColor(marker.color, theme.colors.bg)}
        />
      ))}
    </>
  );
}
