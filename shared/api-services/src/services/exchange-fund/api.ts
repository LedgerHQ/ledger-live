import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { EXCHANGE_FUND_REDUCER_PATH, HEADER_X_LEDGER_CLIENT_VERSION } from "./constants";
import { ExchangeFundApiExtraSchema } from "./schema";
import type { ExchangeFundApiExtra } from "./types";

/**
 * Builds this service's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the
 * config is incomplete (e.g. an env var resolved to an empty string).
 */
export function exchangeFundApiExtra(extra: ExchangeFundApiExtra): ExchangeFundApiExtra {
  return ExchangeFundApiExtraSchema.parse(extra);
}

/** Extracts the {@link ExchangeFundApiExtra} from the `extraArgument` of the api. */
export function getExchangeFundExtra(api: { extra: unknown }): ExchangeFundApiExtra {
  return api.extra as ExchangeFundApiExtra;
}

const exchangeFundBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  const extra = getExchangeFundExtra(api);
  return fetchBaseQuery({
    baseUrl: extra.exchangeFundApiBaseUrl,
    prepareHeaders: headers => {
      headers.set("Content-Type", "application/json");
      headers.set(HEADER_X_LEDGER_CLIENT_VERSION, extra.ledgerClientVersion);
      return headers;
    },
  })(args, api, extraOptions);
};

/**
 * Endpoint-less exchange transaction manager api. Register it in the store; use cases add endpoints
 * and tags to this same object — see
 * {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const exchangeFundApi = createApi({
  reducerPath: EXCHANGE_FUND_REDUCER_PATH,
  baseQuery: exchangeFundBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type ExchangeFundApi = typeof exchangeFundApi;
