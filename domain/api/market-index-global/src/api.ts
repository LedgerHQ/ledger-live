import type { MarketIndexGlobal } from "@domain/entity-market-index-global";
import { countervaluesApi } from "@shared/api-services";
import { transformGlobalMarketDataResponse } from "./transforms";
import type { GlobalMarketDataArgs } from "./types";

/** RTK Query cache tags for the global market index. */
export const MARKET_INDEX_GLOBAL_TAGS = ["GlobalData"] as const;

// `keepUnusedDataFor` is in seconds: the legacy client kept this data 3 minutes.
const THREE_MINUTES_IN_SECONDS = 3 * 60;

/**
 * Global market index endpoint, injected into the shared Countervalues Service api.
 *
 * `enhanceEndpoints` registers this use case's own cache tags on that api and `injectEndpoints` adds
 * the endpoint — both mutate and return the same api object, so this reference shares its reducer,
 * middleware and cache with every other countervalues use case, while only this one is typed with
 * the endpoint below.
 */
export const marketIndexGlobalApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_INDEX_GLOBAL_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getGlobalMarketData: build.query<MarketIndexGlobal, GlobalMarketDataArgs>({
        query: ({ counterCurrency }) => ({
          url: "/v3/markets/global",
          params: { to: counterCurrency },
        }),
        providesTags: [...MARKET_INDEX_GLOBAL_TAGS],
        transformResponse: transformGlobalMarketDataResponse,
        // The shared base query retries three times; this endpoint never did.
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: THREE_MINUTES_IN_SECONDS,
      }),
    }),
  });

export const { useGetGlobalMarketDataQuery } = marketIndexGlobalApi;

export type MarketIndexGlobalApi = typeof marketIndexGlobalApi;
