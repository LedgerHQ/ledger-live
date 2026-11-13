import React from "react";
import { Point, useScrubberContext } from "@ledgerhq/lumen-ui-react/visualization";
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
  const { scrubberPosition } = useScrubberContext();

  if (points.length === 0) return null;

  return (
    <>
      {points.map(marker => (
        <g
          key={`${marker.index}-${marker.value}-${marker.labelPosition ?? "top"}`}
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
            color={resolveMarkerColor(marker.color)}
            magnetic
          />
        </g>
      ))}
    </>
  );
}
