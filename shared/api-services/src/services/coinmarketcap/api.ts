import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { COIN_MARKET_CAP_REDUCER_PATH } from "./constants";
import { CoinMarketCapApiExtraSchema } from "./schema";
import type { CoinMarketCapApiExtra } from "./types";

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
 * Endpoint-less CoinMarketCap api. Register it in the store; use cases add endpoints and tags to this same
 * object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const coinMarketCapApi = createApi({
  reducerPath: COIN_MARKET_CAP_REDUCER_PATH,
  baseQuery: coinMarketCapBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type CoinMarketCapApi = typeof coinMarketCapApi;
