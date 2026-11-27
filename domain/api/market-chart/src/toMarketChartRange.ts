import { MarketChartRangeSchema, type MarketChartRange } from "@domain/entity-market-chart";

/** The range when it is a known one, `undefined` otherwise so the endpoint uses its default. */
export function toMarketChartRange(range: string | undefined): MarketChartRange | undefined {
  const parsed = MarketChartRangeSchema.safeParse(range);
  return parsed.success ? parsed.data : undefined;
}
