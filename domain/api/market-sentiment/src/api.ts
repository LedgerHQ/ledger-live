import type { FearAndGreedIndex } from "@domain/entity-market-sentiment";
import {
  coinMarketCapApi,
  FEAR_AND_GREED_TAGS,
  FIFTEEN_MINUTES_IN_SECONDS,
} from "@domain/api-services";
import { transformFearAndGreedResponse } from "./transforms";

export { FIFTEEN_MINUTES_IN_MS } from "@domain/api-services";

/**
 * Crypto Fear & Greed endpoint, injected into the shared CoinMarketCap service api. `injectEndpoints`
 * returns that same api object, so this reference shares its reducer, middleware and cache with
 * every other CoinMarketCap use case — but only this one is typed with the endpoint below.
 */
export const marketSentimentApi = coinMarketCapApi.injectEndpoints({
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
