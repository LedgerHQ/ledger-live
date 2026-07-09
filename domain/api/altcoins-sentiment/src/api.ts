import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { AltcoinSeasonIndex } from "@domain/entity-altcoins-sentiment";
import { AltcoinsSentimentApiExtraSchema } from "./schema";
import type { AltcoinsSentimentApiExtra } from "./types";
import { transformAltcoinSeasonIndexResponse } from "./transforms";
import {
  ALTCOIN_SEASON_INDEX_TAGS,
  ALTCOINS_SENTIMENT_REDUCER_PATH,
  FIFTEEN_MINUTES_IN_SECONDS,
} from "./internals";

export { FIFTEEN_MINUTES_IN_MS } from "./internals";

/**
 * Builds this package's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the
 * CoinMarketCap URL is missing (e.g. an env var resolved to an empty string).
 */
export function altcoinsSentimentApiExtra(
  extra: AltcoinsSentimentApiExtra,
): AltcoinsSentimentApiExtra {
  return AltcoinsSentimentApiExtraSchema.parse(extra);
}

function getExtra(api: { extra: unknown }): AltcoinsSentimentApiExtra {
  return api.extra as AltcoinsSentimentApiExtra;
}

/** Reads the injected {@link AltcoinsSentimentApiExtra} and delegates to {@link fetchBaseQuery}. */
const altcoinsSentimentBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  const extra = getExtra(api);
  return fetchBaseQuery({ baseUrl: extra.coinMarketCapApiUrl })(args, api, extraOptions);
};

/** RTK Query API for the CoinMarketCap Altcoin Season Index. */
export const altcoinsSentimentApi = createApi({
  reducerPath: ALTCOINS_SENTIMENT_REDUCER_PATH,
  baseQuery: altcoinsSentimentBaseQuery,
  tagTypes: [...ALTCOIN_SEASON_INDEX_TAGS],
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
