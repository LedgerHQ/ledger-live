import type { LineChartPointMarker } from "../types";

/**
 * Lumen's scrubber overlay only spans the drawing area, so a top label drawn above its
 * point (the max marker) escapes it. Bottom labels and dots stay inside and are covered.
 * On the last index the overlay is empty, so nothing is dimmed.
 */
export function isMarkerOutsideScrubberOverlay(
  marker: LineChartPointMarker,
  scrubberPosition: number | undefined,
  lastIndex: number,
): boolean {
  if (scrubberPosition === undefined || scrubberPosition >= lastIndex) return false;
  if (marker.index < scrubberPosition) return false;

  const hasTopLabel = !marker.hideLabel && (marker.labelPosition ?? "top") === "top";
  return hasTopLabel;
}
