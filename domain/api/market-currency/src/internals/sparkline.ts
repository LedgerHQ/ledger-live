import type { SparklineSvgData } from "@domain/entity-market-currency";

const SPARKLINE_X_MAGNITUDE = 5;
const SPARKLINE_Y_HEIGHT = 50;

/** Keeps `n` points spread over `items`, always the first and the last one. */
export function distributedCopy(items: number[], n: number): number[] {
  if (!items) return [];
  if (items.length <= n) return items;
  const elements = [items[0]];
  const totalItems = items.length - 2;
  const interval = Math.floor(totalItems / (n - 2));
  for (let i = 1; i < n - 1; i++) {
    elements.push(items[i * interval]);
  }
  elements.push(items[items.length - 1]);
  return elements;
}

export function toSparklineSvgData(points: number[]): SparklineSvgData {
  const totalXSteps = SPARKLINE_X_MAGNITUDE * points.length;
  const min = Math.min(...points);
  const max = Math.max(...points);

  const yOffset = max - min;

  return {
    path: points
      .map((d, i) => {
        const [x, y] = [
          i * SPARKLINE_X_MAGNITUDE,
          SPARKLINE_Y_HEIGHT + 3 - ((d - min) * SPARKLINE_Y_HEIGHT) / yOffset,
        ];
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" "),
    viewBox: `0 0 ${totalXSteps} ${SPARKLINE_Y_HEIGHT + 3}`,
    isPositive: points[0] <= points[points.length - 1],
  };
}
