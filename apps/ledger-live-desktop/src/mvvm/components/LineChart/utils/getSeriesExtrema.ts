import type { LineChartSeries } from "../types";

export type SeriesExtremum = Readonly<{
  index: number;
  value: number;
}>;

export type SeriesExtrema = Readonly<{
  min: SeriesExtremum;
  max: SeriesExtremum;
}>;

export function getSeriesExtrema(series: LineChartSeries[]): SeriesExtrema | null {
  const primary = series[0];
  const data = primary?.data;
  if (!data || data.length === 0) return null;

  let minIndex = -1;
  let maxIndex = -1;
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < data.length; index += 1) {
    const value = data[index];
    if (value == null || Number.isNaN(value)) continue;

    if (value < minValue) {
      minValue = value;
      minIndex = index;
    }
    if (value > maxValue) {
      maxValue = value;
      maxIndex = index;
    }
  }

  if (minIndex === -1 || maxIndex === -1) return null;

  return {
    min: { index: minIndex, value: minValue },
    max: { index: maxIndex, value: maxValue },
  };
}
