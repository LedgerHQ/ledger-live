// CoinMarketCap service: base query, cache tags and the endpoint-less api its use cases inject into.

import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every CoinMarketCap-backed api. The app supplies the resolved
 * CoinMarketCap URL at store configuration time, so this package owns no env/config dependency.
 */
export const CoinMarketCapApiExtraSchema = z.object({
  coinMarketCapApiUrl: z.string().min(1),
});

/** Slice of the Redux thunk `extraArgument` owned by the CoinMarketCap service. */
export type CoinMarketCapApiExtra = z.infer<typeof CoinMarketCapApiExtraSchema>;

/** RTK Query cache tags for the Altcoin Season Index. */
export const ALTCOIN_SEASON_INDEX_TAGS = ["AltcoinSeasonIndexLatest"] as const;

/** RTK Query cache tags for the Crypto Fear & Greed index. */
export const FEAR_AND_GREED_TAGS = ["FearAndGreedLatest"] as const;

/**
 * Every tag any CoinMarketCap use case may provide or invalidate. `tagTypes` is only accepted by
 * `createApi`, never by `injectEndpoints`, so this file has to declare the full set upfront.
 */
export const COIN_MARKET_CAP_TAGS = [...ALTCOIN_SEASON_INDEX_TAGS, ...FEAR_AND_GREED_TAGS] as const;

const ONE_MINUTE_IN_SECONDS = 60;

/** Cache lifetime matching CMC's 15-minute update frequency, expressed in seconds for RTK Query. */
export const FIFTEEN_MINUTES_IN_SECONDS = 15 * ONE_MINUTE_IN_SECONDS;

const ONE_MINUTE_IN_MS = 60 * 1000;

/** Polling interval matching CMC's 15-minute update frequency, in milliseconds. */
export const FIFTEEN_MINUTES_IN_MS = 15 * ONE_MINUTE_IN_MS;

/**
 * Builds this service's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the
 * CoinMarketCap URL is missing (e.g. an env var resolved to an empty string).
 */
export function coinMarketCapApiExtra(extra: CoinMarketCapApiExtra): CoinMarketCapApiExtra {
  return CoinMarketCapApiExtraSchema.parse(extra);
}

/** Extracts the {@link CoinMarketCapApiExtra} from the `extraArgument` of the api. */
export function getCoinMarketCapExtra(api: { extra: unknown }): CoinMarketCapApiExtra {
  return api.extra as CoinMarketCapApiExtra;
}

/** Reads the injected {@link CoinMarketCapApiExtra} and delegates to {@link fetchBaseQuery}. */
const coinMarketCapBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  const extra = getCoinMarketCapExtra(api);
  return fetchBaseQuery({ baseUrl: extra.coinMarketCapApiUrl })(args, api, extraOptions);
};

/**
 * The CoinMarketCap service api: owns the base URL, the reducer path and the cache tags, but no
 * endpoints. Use-case packages call `injectEndpoints` on it — which mutates and returns this same
 * object, so cache, reducer and middleware stay unified across them.
 *
 * Register this in the store; never call endpoints on it. Only the injected reference returned by
 * a use-case package carries the endpoint types.
 */
export const coinMarketCapApi = createApi({
  reducerPath: "coinMarketCapApi",
  baseQuery: coinMarketCapBaseQuery,
  tagTypes: [...COIN_MARKET_CAP_TAGS],
  endpoints: () => ({}),
});

export type CoinMarketCapApi = typeof coinMarketCapApi;
