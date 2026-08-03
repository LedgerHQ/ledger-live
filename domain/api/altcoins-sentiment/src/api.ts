import type { AltcoinSeasonIndex } from "@domain/entity-altcoins-sentiment";
import {
  ALTCOIN_SEASON_INDEX_TAGS,
  coinMarketCapApi,
  FIFTEEN_MINUTES_IN_SECONDS,
} from "@domain/api-services";
import { transformAltcoinSeasonIndexResponse } from "./transforms";

export { FIFTEEN_MINUTES_IN_MS } from "@domain/api-services";

/**
 * Altcoin Season Index endpoint, injected into the shared CoinMarketCap service api. `injectEndpoints`
 * returns that same api object, so this reference shares its reducer, middleware and cache with
 * every other CoinMarketCap use case — but only this one is typed with the endpoint below.
 */
export const altcoinsSentimentApi = coinMarketCapApi.injectEndpoints({
  endpoints: build => ({
    getAltcoinSeasonIndexLatest: build.query<AltcoinSeasonIndex, void>({
      query: () => ({ url: "/altcoin-season-index/latest" }),
      providesTags: [...ALTCOIN_SEASON_INDEX_TAGS],
      transformResponse: transformAltcoinSeasonIndexResponse,
      keepUnusedDataFor: FIFTEEN_MINUTES_IN_SECONDS,
    }),
  }),
});

export const { useGetAltcoinSeasonIndexLatestQuery } = altcoinsSentimentApi;

export type AltcoinsSentimentApi = typeof altcoinsSentimentApi;
