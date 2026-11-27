import type { MarketChartRange } from "@domain/entity-market-chart";

type ChartRangeSegment = "1h" | "1d" | "1w" | "1m" | "6m" | "1y" | "5y" | "all";

const SEGMENT_BY_RANGE: Record<MarketChartRange, ChartRangeSegment> = {
  "1h": "1h",
  "1d": "1d",
  "24h": "1d",
  day: "1d",
  "1w": "1w",
  "7d": "1w",
  week: "1w",
  "1m": "1m",
  "30d": "1m",
  month: "1m",
  "6m": "6m",
  "1y": "1y",
  year: "1y",
  "5y": "5y",
  all: "all",
};

const DEFAULT_SEGMENT: ChartRangeSegment = "1d";

export function getChartRangeSegment(range: string): ChartRangeSegment {
  return Object.hasOwn(SEGMENT_BY_RANGE, range)
    ? SEGMENT_BY_RANGE[range as MarketChartRange]
    : DEFAULT_SEGMENT;
}
