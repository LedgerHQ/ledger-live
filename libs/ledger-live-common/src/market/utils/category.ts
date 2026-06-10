import type { MarketCurrencyData } from "./types";

/** The built-in (non-trending) categories the Market list can be filtered by. */
export type BuiltInMarketListCategory = "all" | "starred" | "stocks";

/**
 * Categories the Market list can be filtered by (shared by desktop & mobile).
 * Besides the built-ins, the value can be a trending category id (e.g. "infrastructure")
 * fetched from `/v3/categories/trending`. The `(string & {})` keeps literal autocomplete.
 */
export type MarketListCategory = BuiltInMarketListCategory | (string & {});

const BUILT_IN_MARKET_LIST_CATEGORIES = new Set<BuiltInMarketListCategory>([
  "all",
  "starred",
  "stocks",
]);

/** Backend `filter` value used to request the tokenized-stocks list. */
export const STOCK_MARKET_FILTER = "stock";

/** Whether the category is one of the built-in filters rather than a trending category id. */
export function isBuiltInMarketListCategory(
  category: MarketListCategory,
): category is BuiltInMarketListCategory {
  return BUILT_IN_MARKET_LIST_CATEGORIES.has(category as BuiltInMarketListCategory);
}

/** Parses an arbitrary value (deeplink param, persisted state…) into a known built-in category. */
export function parseMarketListCategory(category: unknown): BuiltInMarketListCategory | undefined {
  if (typeof category !== "string") {
    return undefined;
  }

  const normalizedCategory = category.trim().toLowerCase() as BuiltInMarketListCategory;

  return isBuiltInMarketListCategory(normalizedCategory) ? normalizedCategory : undefined;
}

/** Returns the backend `filter` param to send for the given category, if any. */
export function getMarketFilter(isStocksCategory: boolean): string | undefined {
  return isStocksCategory ? STOCK_MARKET_FILTER : undefined;
}

/**
 * Returns the backend `categories` param for a trending category, or undefined for built-ins.
 * Used to filter `/v3/markets` by a trending category id.
 */
export function getMarketCategoriesParam(category: MarketListCategory): string | undefined {
  return isBuiltInMarketListCategory(category) ? undefined : category;
}

/**
 * Client-side guard: the backend `stock` filter is not yet exhaustive, so we
 * additionally keep only tokenized-stock currencies.
 */
export function isStockMarketCurrency(item: MarketCurrencyData): boolean {
  const id = item.id.toLowerCase();
  const name = item.name.toLowerCase();

  return (
    id.includes("xstock") ||
    id.includes("tokenized-stock") ||
    id.includes("prestocks") ||
    name.includes("xstock") ||
    name.includes("tokenized stock") ||
    name.includes("prestocks")
  );
}
