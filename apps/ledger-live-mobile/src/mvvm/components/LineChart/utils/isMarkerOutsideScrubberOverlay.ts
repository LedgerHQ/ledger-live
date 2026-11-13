import type { LineChartPointMarker } from "../types";

/**
 * Lumen's scrubber overlay only spans the drawing area, so a top label drawn above its
 * point (the max marker) escapes it. Bottom labels and dots stay inside and are covered.
 */
export function isMarkerOutsideScrubberOverlay(
  marker: LineChartPointMarker,
  scrubberPosition: number | undefined,
): boolean {
  if (scrubberPosition === undefined || marker.index <= scrubberPosition) return false;

  const hasTopLabel = !marker.hideLabel && (marker.labelPosition ?? "top") === "top";
  return hasTopLabel;
}
