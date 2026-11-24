import {
  TrendingCategoriesSchema,
  type TrendingCategory,
} from "@domain/entity-market-trending-categories";

/** The Market list keeps at most this many trending categories, in the order the backend returns them. */
export const MAX_TRENDING_CATEGORIES = 5;

/** Validates the raw `/v3/categories/trending` response and keeps the first trending categories. Throws on an invalid payload. */
export function transformTrendingCategoriesResponse(response: unknown): TrendingCategory[] {
  return TrendingCategoriesSchema.parse(response).slice(0, MAX_TRENDING_CATEGORIES);
}
