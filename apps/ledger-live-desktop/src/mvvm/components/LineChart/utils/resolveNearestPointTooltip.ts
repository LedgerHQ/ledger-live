import type { LineChartPointTooltip } from "../types";

/**
 * Caps how far (in data indices) the scrubbed index may sit from a marker while
 * still resolving to its tooltip. Scaled to ~1% of the data length so the catch
 * area stays roughly constant in pixels across dense and sparse ranges.
 */
function getToleranceForDataLength(dataLength: number): number {
  return Math.max(1, Math.round(dataLength / 100));
}

/**
 * Resolves the tooltip of the marker nearest to `dataIndex`, or `undefined` when the
 * nearest marker is farther than the density-aware tolerance allows.
 */
export function resolveNearestPointTooltip(
  pointTooltips: ReadonlyMap<number, LineChartPointTooltip>,
  dataIndex: number,
  dataLength: number,
): LineChartPointTooltip | undefined {
  const tolerance = getToleranceForDataLength(dataLength);

  let nearest: LineChartPointTooltip | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const [index, tooltip] of pointTooltips) {
    const distance = Math.abs(index - dataIndex);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = tooltip;
    }
  }

  return nearestDistance <= tolerance ? nearest : undefined;
}
