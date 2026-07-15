import { cssVar } from "@ledgerhq/lumen-design-core";
import type { LineChartColor, LineChartRange } from "./types";

export const LINE_CHART_RANGES: readonly LineChartRange[] = [
  "1d",
  "1w",
  "1m",
  "6m",
  "1y",
  "5y",
  "all",
];

export const DEFAULT_LINE_CHART_HEIGHT = 240;

/** Matches @ledgerhq/lumen-ui-react-visualization CartesianChart overflow margins. */
export const LUMEN_CHART_OVERFLOW_MARGIN = 30;

export const LINE_CHART_DRAWING_INSET = {
  top: LUMEN_CHART_OVERFLOW_MARGIN,
} as const;

export const LINE_CHART_COLOR_TO_STROKE = {
  success: cssVar("var(--color-background-success-strong)"),
  error: cssVar("var(--color-background-error-strong)"),
  muted: cssVar("var(--color-background-muted-strong)"),
} as const satisfies Record<LineChartColor, string>;

export const LINE_CHART_POINT_SIZE = 10;

export const LINE_CHART_EXTREMA_COLORS = {
  max: "success",
  min: "error",
} as const satisfies { max: LineChartColor; min: LineChartColor };
