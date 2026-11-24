import type { MarketChartRange, MarketCoinDataChart } from "@domain/entity-market-chart";
import { MarketChartResponseSchema, SupportedChartCounterCurrenciesResponseSchema } from "./schema";

/** Validates the raw chart response and keys its values by the requested range. */
export function transformMarketChartResponse(
  response: unknown,
  range: MarketChartRange,
): MarketCoinDataChart {
  const { values } = MarketChartResponseSchema.parse(response);
  return { [range]: values };
}

/** Validates the raw counter currency list and lowercases every entry. */
export function transformSupportedChartCounterCurrencies(response: unknown): string[] {
  return SupportedChartCounterCurrenciesResponseSchema.parse(response).map(currency =>
    currency.toLowerCase(),
  );
}
