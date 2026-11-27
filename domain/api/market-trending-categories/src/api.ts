import { countervaluesApi } from "@shared/api-services";
import {
  MarketTrendingCategoriesSchema,
  type MarketTrendingCategory,
} from "@domain/entity-market-trending-categories";
import {
  describeSchemaFailure,
  MAX_TRENDING_CATEGORIES,
  TRENDING_CATEGORIES_KEEP_UNUSED_DATA_FOR,
  TRENDING_CATEGORIES_TAGS,
} from "./internals";

/**
 * Trending categories endpoint, injected into the shared Countervalues Service api.
 *
 * `enhanceEndpoints` and `injectEndpoints` mutate and return that same api object, so this shares
 * its reducer, middleware and cache with every other CVS use case.
 */
export const marketTrendingCategoriesApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: TRENDING_CATEGORIES_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getTrendingCategories: build.query<MarketTrendingCategory[], void>({
        query: () => "/v3/categories/trending",
        providesTags: ["TrendingCategories"],
        rawResponseSchema: MarketTrendingCategoriesSchema,
        transformResponse: (categories: MarketTrendingCategory[]) =>
          categories.slice(0, MAX_TRENDING_CATEGORIES),
        catchSchemaFailure: describeSchemaFailure,
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: TRENDING_CATEGORIES_KEEP_UNUSED_DATA_FOR,
      }),
    }),
  });

export const { useGetTrendingCategoriesQuery } = marketTrendingCategoriesApi;

export type MarketTrendingCategoriesApi = typeof marketTrendingCategoriesApi;
