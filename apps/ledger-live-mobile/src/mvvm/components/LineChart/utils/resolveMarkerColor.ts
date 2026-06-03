import type { LineChartColor, LineChartPointMarker } from "../types";
import { resolveLineChartStroke } from "./resolveLineChartStroke";

const LINE_CHART_COLOR_NAMES = new Set<string>(["success", "error", "muted"]);

function isLineChartColor(color: string): color is LineChartColor {
  return LINE_CHART_COLOR_NAMES.has(color);
}

type BgColors = Parameters<typeof resolveLineChartStroke>[1];

export function resolveMarkerColor(
  color: LineChartPointMarker["color"],
  bg: BgColors,
): string | undefined {
  if (color == null) return undefined;
  return isLineChartColor(color) ? resolveLineChartStroke(color, bg) : color;
}
