import React from "react";
import { G } from "react-native-svg";
import { Point, useScrubberContext } from "@ledgerhq/lumen-ui-rnative/visualization";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { LINE_CHART_POINT_SIZE, LINE_CHART_SCRUBBER_DIMMED_OPACITY } from "./constants";
import { isMarkerOutsideScrubberOverlay } from "./utils/isMarkerOutsideScrubberOverlay";
import { resolveMarkerColor } from "./utils/resolveMarkerColor";
import type { LineChartPointMarker, LineChartValueFormatter } from "./types";

type LineChartPointsProps = Readonly<{
  points: LineChartPointMarker[];
  formatValue: LineChartValueFormatter;
  /** Index of the last data point of the primary series. */
  lastIndex: number;
}>;

export function LineChartPoints({ points, formatValue, lastIndex }: LineChartPointsProps) {
  const { theme } = useTheme();
  const { scrubberPosition } = useScrubberContext();

  if (points.length === 0) return null;

  return (
    <>
      {points.map(marker => (
        <G
          // `hidePoint`/`color` discriminate markers that share an index, value and
          // label position (e.g. a transaction dot landing on a min/max marker).
          key={`${marker.index}-${marker.value}-${marker.labelPosition ?? "top"}-${
            marker.hidePoint ? "h" : "v"
          }-${marker.color ?? ""}`}
          opacity={
            isMarkerOutsideScrubberOverlay(marker, scrubberPosition, lastIndex)
              ? LINE_CHART_SCRUBBER_DIMMED_OPACITY
              : undefined
          }
        >
          <Point
            dataX={marker.index}
            dataY={marker.value}
            label={marker.hideLabel ? undefined : (marker.label ?? formatValue(marker.value))}
            labelPosition={marker.labelPosition ?? "top"}
            hidePoint={marker.hidePoint}
            size={LINE_CHART_POINT_SIZE}
            color={resolveMarkerColor(marker.color, theme.colors.bg)}
            magnetic
          />
        </G>
      ))}
    </>
  );
}
