import type { TrendingCategory } from "@domain/entity-market-trending-categories";
import { countervaluesApi } from "@shared/api-services";
import { transformTrendingCategoriesResponse } from "./transforms";

/** RTK Query cache tags for the trending categories list. */
export const TRENDING_CATEGORIES_TAGS = ["TrendingCategories"] as const;

// `keepUnusedDataFor` is in seconds: the legacy client kept this data 3 minutes.
const THREE_MINUTES_IN_SECONDS = 3 * 60;

/**
 * Trending categories endpoint, injected into the shared Countervalues Service api.
 *
 * `enhanceEndpoints` registers this use case's cache tags on that api and `injectEndpoints` adds the
 * endpoint. Both mutate and return the same api object, so this reference shares its reducer,
 * middleware and cache with every other countervalues use case.
 */
export const trendingCategoriesApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: TRENDING_CATEGORIES_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getTrendingCategories: build.query<TrendingCategory[], void>({
        query: () => ({ url: "/v3/categories/trending" }),
        providesTags: [...TRENDING_CATEGORIES_TAGS],
        transformResponse: transformTrendingCategoriesResponse,
        // The shared base query retries three times; this endpoint never did.
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: THREE_MINUTES_IN_SECONDS,
      }),
    }),
  });

export const { useGetTrendingCategoriesQuery } = trendingCategoriesApi;

export type TrendingCategoriesApi = typeof trendingCategoriesApi;
