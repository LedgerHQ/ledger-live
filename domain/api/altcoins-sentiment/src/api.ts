import type { AltcoinSeasonIndex } from "@domain/entity-altcoins-sentiment";
import { coinMarketCapApi, FIFTEEN_MINUTES_IN_SECONDS } from "@shared/api-services";
import { transformAltcoinSeasonIndexResponse } from "./transforms";

export { FIFTEEN_MINUTES_IN_MS } from "@shared/api-services";

/** RTK Query cache tags for the Altcoin Season Index. */
export const ALTCOIN_SEASON_INDEX_TAGS = ["AltcoinSeasonIndexLatest"] as const;

/**
 * Altcoin Season Index endpoint, injected into the shared CoinMarketCap service api.
 *
 * `enhanceEndpoints` registers this use case's own cache tags on that api and `injectEndpoints` adds
 * the endpoint — both mutate and return the same api object, so this reference shares its reducer,
 * middleware and cache with every other CoinMarketCap use case, while only this one is typed with the
 * endpoint below.
 */
export const altcoinsSentimentApi = coinMarketCapApi
  .enhanceEndpoints({ addTagTypes: ALTCOIN_SEASON_INDEX_TAGS })
  .injectEndpoints({
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
