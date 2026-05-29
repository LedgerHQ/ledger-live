import { LINE_CHART_COLOR_TO_STROKE } from "../constants";
import type { LineChartColor, LineChartPointMarker } from "../types";

const LINE_CHART_COLOR_NAMES = new Set<string>(Object.keys(LINE_CHART_COLOR_TO_STROKE));

function isLineChartColor(color: string): color is LineChartColor {
  return LINE_CHART_COLOR_NAMES.has(color);
}

export function resolveMarkerColor(color: LineChartPointMarker["color"]): string | undefined {
  if (color == null) return undefined;
  return isLineChartColor(color) ? LINE_CHART_COLOR_TO_STROKE[color] : color;
}
