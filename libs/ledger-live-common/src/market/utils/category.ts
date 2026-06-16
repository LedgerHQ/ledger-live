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

/** Backend `categories` value used to request the tokenized-stocks list. */
export const STOCK_MARKET_CATEGORY = "tokenized-stock";

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

/**
 * Returns the backend `categories` param to filter `/v3/markets` by, or undefined for the
 * `all`/`starred` built-ins. The `stocks` built-in maps to the dedicated CVS category, while
 * trending categories pass their id through.
 */
export function getMarketCategoriesParam(category: MarketListCategory): string | undefined {
  if (category === "stocks") {
    return STOCK_MARKET_CATEGORY;
  }

  return isBuiltInMarketListCategory(category) ? undefined : category;
}
