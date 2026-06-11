import type { MarketListCategory } from "~/reducers/types";

const MARKET_LIST_CATEGORIES = new Set<MarketListCategory>(["all", "starred", "stocks"]);

export function parseMarketListCategory(category: unknown): MarketListCategory | undefined {
  if (typeof category !== "string") {
    return undefined;
  }

  const normalizedCategory = category.trim().toLowerCase() as MarketListCategory;

  return MARKET_LIST_CATEGORIES.has(normalizedCategory) ? normalizedCategory : undefined;
}
