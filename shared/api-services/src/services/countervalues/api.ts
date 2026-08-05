import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { COUNTERVALUES_REDUCER_PATH, MAX_RETRIES } from "./constants";
import { CvsApiExtraSchema } from "./schema";
import type { CvsApiExtra } from "./types";

/**
 * Builds this service's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the
 * Countervalues Service config is incomplete (e.g. an env var resolved to an empty string).
 */
export function cvsApiExtra(extra: CvsApiExtra): CvsApiExtra {
  return CvsApiExtraSchema.parse(extra);
}

/** Extracts the {@link CvsApiExtra} from the `extraArgument` of the api. */
export function getCvsExtra(api: { extra: unknown }): CvsApiExtra {
  return api.extra as CvsApiExtra;
}

/** Reads the injected {@link CvsApiExtra} and delegates to {@link fetchBaseQuery}. Wrapped in `retry`. */
const cvsBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = retry(
  (args, api, extraOptions) => {
    const extra = getCvsExtra(api);
    return fetchBaseQuery({
      baseUrl: extra.countervaluesServiceUrl,
      prepareHeaders: headers => {
        headers.set("Accept", "application/json");
        return headers;
      },
    })(args, api, extraOptions);
  },
  { maxRetries: MAX_RETRIES },
);

/**
 * Endpoint-less Countervalues Service api. Register it in the store; use cases add endpoints and tags
 * to this same object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const countervaluesApi = createApi({
  reducerPath: COUNTERVALUES_REDUCER_PATH,
  baseQuery: cvsBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type CountervaluesApi = typeof countervaluesApi;
