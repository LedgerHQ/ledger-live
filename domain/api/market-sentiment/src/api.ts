import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { FearAndGreedIndex } from "@domain/entity-market-sentiment";
import { MarketSentimentApiExtraSchema } from "./schema";
import type { MarketSentimentApiExtra } from "./types";
import { transformFearAndGreedResponse } from "./transforms";
import {
  FEAR_AND_GREED_TAGS,
  FIFTEEN_MINUTES_IN_SECONDS,
  MARKET_SENTIMENT_REDUCER_PATH,
} from "./internals";

export { FIFTEEN_MINUTES_IN_MS } from "./internals";

/**
 * Builds this package's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the
 * CoinMarketCap URL is missing (e.g. an env var resolved to an empty string).
 */
export function marketSentimentApiExtra(extra: MarketSentimentApiExtra): MarketSentimentApiExtra {
  return MarketSentimentApiExtraSchema.parse(extra);
}

function getExtra(api: { extra: unknown }): MarketSentimentApiExtra {
  return api.extra as MarketSentimentApiExtra;
}

/** Reads the injected {@link MarketSentimentApiExtra} and delegates to {@link fetchBaseQuery}. */
const marketSentimentBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  const extra = getExtra(api);
  return fetchBaseQuery({ baseUrl: extra.coinMarketCapApiUrl })(args, api, extraOptions);
};

/** RTK Query API for the CoinMarketCap Crypto Fear & Greed index. */
export const marketSentimentApi = createApi({
  reducerPath: MARKET_SENTIMENT_REDUCER_PATH,
  baseQuery: marketSentimentBaseQuery,
  tagTypes: [...FEAR_AND_GREED_TAGS],
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
