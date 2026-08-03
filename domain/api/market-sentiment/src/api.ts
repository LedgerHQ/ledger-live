import type { FearAndGreedIndex } from "@domain/entity-market-sentiment";
import { coinMarketCapApi, FIFTEEN_MINUTES_IN_SECONDS } from "@shared/api-services";
import { transformFearAndGreedResponse } from "./transforms";

export { FIFTEEN_MINUTES_IN_MS } from "@shared/api-services";

/** RTK Query cache tags for the Crypto Fear & Greed index. */
export const FEAR_AND_GREED_TAGS = ["FearAndGreedLatest"] as const;

/**
 * Crypto Fear & Greed endpoint, injected into the shared CoinMarketCap service api.
 *
 * `enhanceEndpoints` registers this use case's own cache tags on that api and `injectEndpoints` adds
 * the endpoint — both mutate and return the same api object, so this reference shares its reducer,
 * middleware and cache with every other CoinMarketCap use case, while only this one is typed with the
 * endpoint below.
 */
export const marketSentimentApi = coinMarketCapApi
  .enhanceEndpoints({ addTagTypes: FEAR_AND_GREED_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getFearAndGreedLatest: build.query<FearAndGreedIndex, void>({
        query: () => ({ url: "/fear-and-greed/latest" }),
        providesTags: [...FEAR_AND_GREED_TAGS],
        transformResponse: transformFearAndGreedResponse,
        keepUnusedDataFor: FIFTEEN_MINUTES_IN_SECONDS,
      }),
    }),
  });

export const { useGetFearAndGreedLatestQuery } = marketSentimentApi;

export type MarketSentimentApi = typeof marketSentimentApi;
