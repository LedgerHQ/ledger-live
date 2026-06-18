import { KeysPriceChange } from "./types";

/** Chart ranges with a matching market-API `priceChangePercentage` key. */
export const BASE_RANGE_TO_PRICE_CHANGE_KEY = {
  "1d": KeysPriceChange.day,
  "1w": KeysPriceChange.week,
  "1m": KeysPriceChange.month,
  "1y": KeysPriceChange.year,
} as const;

type BaseRangeKey = keyof typeof BASE_RANGE_TO_PRICE_CHANGE_KEY;

/**
 * Resolves a chart range to its market-API price-change key.
 * Pass `extensions` for platform-specific ranges (e.g. desktop `6m`, `5y`).
 */
export function getPriceChangeKeyForRange(
  range: string,
  extensions?: Partial<Record<string, KeysPriceChange>>,
): KeysPriceChange | undefined {
  const extensionKey = extensions?.[range];
  if (extensionKey != null) return extensionKey;
  return BASE_RANGE_TO_PRICE_CHANGE_KEY[range as BaseRangeKey];
}
