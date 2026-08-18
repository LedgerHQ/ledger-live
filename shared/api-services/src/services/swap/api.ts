import {
  createApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { createAuthenticatedBaseQuery } from "@shared/auth";
import { HEADER_X_LEDGER_CLIENT_VERSION, SWAP_REDUCER_PATH } from "./constants";
import { SwapApiExtraSchema } from "./schema";
import type { SwapApiExtra } from "./types";

/**
 * Builds this service's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the swap
 * config is incomplete (e.g. an env var resolved to an empty string).
 */
export function swapApiExtra(extra: SwapApiExtra): SwapApiExtra {
  return SwapApiExtraSchema.parse(extra);
}

/** Extracts the {@link SwapApiExtra} from the `extraArgument` of the api. */
export function getSwapExtra(api: { extra: unknown }): SwapApiExtra {
  return api.extra as SwapApiExtra;
}

/**
 * Reads the injected {@link SwapApiExtra} and delegates to the authenticated base query, so whether a
 * request carries an `Authorization` header is decided by the auth feature flag rather than here.
 *
 * Not wrapped in `retry`: quotes are time-sensitive and the caller re-requests on input changes.
 */
const swapBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions,
) => {
  const extra = getSwapExtra(api);
  return createAuthenticatedBaseQuery({
    baseUrl: extra.swapApiBaseUrl,
    // `fetch` does not inherit the axios default headers `@ledgerhq/live-network` sets.
    prepareHeaders: headers => {
      headers.set(HEADER_X_LEDGER_CLIENT_VERSION, extra.ledgerClientVersion);
      return headers;
    },
  })(args, api, extraOptions);
};

/**
 * Endpoint-less swap aggregator api. Register it in the store; use cases add endpoints and tags to
 * this same object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const swapApi = createApi({
  reducerPath: SWAP_REDUCER_PATH,
  baseQuery: swapBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type SwapApi = typeof swapApi;
