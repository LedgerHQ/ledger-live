import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { CAL_REDUCER_PATH, HEADER_X_LEDGER_CLIENT_VERSION, MAX_RETRIES } from "./constants";
import { CalApiExtraSchema } from "./schema";
import type { CalApiExtra } from "./types";

/**
 * Builds this service's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the CAL
 * config is incomplete (e.g. an env var resolved to an empty string).
 */
export function calApiExtra(extra: CalApiExtra): CalApiExtra {
  return CalApiExtraSchema.parse(extra);
}

/**
 * Extracts the {@link CalApiExtra} from the `extraArgument` of the api. Exported because endpoints
 * that bypass the base query — e.g. a `queryFn` issuing its own `fetch` — still need the config.
 */
export function getCalExtra(api: { extra: unknown }): CalApiExtra {
  return api.extra as CalApiExtra;
}

/** Reads the injected {@link CalApiExtra} and delegates to {@link fetchBaseQuery}. Wrapped in `retry`. */
const calBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = retry(
  (args, api, extraOptions) => {
    const extra = getCalExtra(api);
    return fetchBaseQuery({
      baseUrl: extra.calServiceUrl,
      prepareHeaders: headers => {
        headers.set("Content-Type", "application/json");
        headers.set(HEADER_X_LEDGER_CLIENT_VERSION, extra.ledgerClientVersion);
        return headers;
      },
    })(args, api, extraOptions);
  },
  { maxRetries: MAX_RETRIES },
);

/**
 * Endpoint-less CAL api. Register it in the store; use cases add endpoints and tags to this same
 * object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const calApi = createApi({
  reducerPath: CAL_REDUCER_PATH,
  baseQuery: calBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type CalApi = typeof calApi;
