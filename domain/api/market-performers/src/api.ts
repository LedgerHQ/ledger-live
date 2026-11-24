import {
  getRange,
  MAX_MARKETS_PAGE_SIZE,
  type MarketItemResponse,
} from "@domain/api-market-currency";
import type { MarketItemPerformer } from "@domain/entity-market-performers";
import { countervaluesApi } from "@shared/api-services";
import { TrendingCurrenciesResponseSchema } from "./schema";
import { formatMarketPerformer } from "./transforms";
import type { MarketPerformersQueryArg, TrendingPerformersQueryArg } from "./types";

/** RTK Query cache tags for the market performers lists. */
export const MARKET_PERFORMERS_TAGS = ["Performers", "TrendingPerformers"] as const;

const DEFAULT_PERFORMERS_LIMIT = 5;
const DEFAULT_PERFORMERS_TOP = 50;

// `keepUnusedDataFor` is in seconds: the legacy client kept these lists 1 minute.
const ONE_MINUTE_IN_SECONDS = 60;

/**
 * Market performers endpoints, injected into the shared Countervalues Service api.
 *
 * `enhanceEndpoints` registers this use case's cache tags on that api and `injectEndpoints` adds the
 * endpoints. Both mutate and return the same api object, so these endpoints share its reducer,
 * middleware and cache with every other countervalues use case.
 */
export const marketPerformersApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_PERFORMERS_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getMarketPerformers: build.query<MarketItemPerformer[], MarketPerformersQueryArg>({
        query: ({
          counterCurrency,
          range,
          limit = DEFAULT_PERFORMERS_LIMIT,
          top = DEFAULT_PERFORMERS_TOP,
          sort,
          supported,
        }) => ({
          url: "/v3/markets",
          params: {
            to: counterCurrency,
            limit,
            top,
            sort: `${sort === "asc" ? "positive" : "negative"}-price-change-${getRange(range)}`,
            supported,
          },
        }),
        providesTags: ["Performers"],
        transformResponse: (response: MarketItemResponse[]) => response.map(formatMarketPerformer),
        // The shared base query retries three times; this endpoint never did.
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: ONE_MINUTE_IN_SECONDS,
      }),
      getTrendingPerformers: build.query<MarketItemPerformer[], TrendingPerformersQueryArg>({
        async queryFn({ counterCurrency }, _api, _extraOptions, fetchWithBQ) {
          const trendingResult = await fetchWithBQ({
            url: "/v3/currencies/trending",
          });
          if (trendingResult.error) return { error: trendingResult.error };

          const parsed = TrendingCurrenciesResponseSchema.safeParse(trendingResult.data);
          if (!parsed.success) {
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: `[Market API] Trending currencies schema validation failed: ${parsed.error.issues
                  .map(issue => `${issue.path.join(".")}: ${issue.message}`)
                  .join(", ")}`,
              },
            };
          }

          const supportedIds = parsed.data
            .filter(currency => currency.supported)
            .map(({ id }) => id);
          if (supportedIds.length === 0) return { data: [] };

          const marketsResult = await fetchWithBQ({
            url: "/v3/markets",
            params: {
              to: counterCurrency,
              ids: supportedIds.join(","),
              pageSize: MAX_MARKETS_PAGE_SIZE,
            },
          });
          if (marketsResult.error) return { error: marketsResult.error };

          const marketById = new Map(
            (marketsResult.data as MarketItemResponse[]).map(item => [item.id, item]),
          );
          // Keep the trending order returned by the backend, not the order of the markets response.
          const data = supportedIds
            .map(id => marketById.get(id))
            .filter((item): item is MarketItemResponse => item !== undefined)
            .map(formatMarketPerformer);

          return { data };
        },
        providesTags: ["TrendingPerformers"],
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: ONE_MINUTE_IN_SECONDS,
      }),
    }),
  });

export const { useGetMarketPerformersQuery, useGetTrendingPerformersQuery } = marketPerformersApi;

export type MarketPerformersApi = typeof marketPerformersApi;
