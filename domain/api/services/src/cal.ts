// Crypto Asset List (CAL) service: base query, cache tags and the endpoint-less api its use cases
// inject into.

import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every CAL-backed api. The app supplies the resolved CAL service
 * URL, client version and an optional logger at store configuration time, so this package owns no
 * env/config/logging dependency. The app picks the prod or staging URL — there is no staging switch
 * in here.
 */
export const CalApiExtraSchema = z.object({
  calServiceUrl: z.string().min(1),
  ledgerClientVersion: z.string().min(1),
  logger: z.custom<(...args: unknown[]) => void>().optional(),
});

/** Slice of the Redux thunk `extraArgument` owned by the CAL service. */
export type CalApiExtra = z.infer<typeof CalApiExtraSchema>;

/**
 * RTK Query cache tags for CAL token data. `tagTypes` is only accepted by `createApi`, never by
 * `injectEndpoints`, so this file has to declare the full set upfront.
 */
export const TOKEN_TAGS = ["Tokens"] as const;

/** Max retries for transient CAL request failures. */
const MAX_RETRIES = 3;

/** Request header carrying the Ledger client version on every CAL request. */
export const HEADER_X_LEDGER_CLIENT_VERSION = "X-Ledger-Client-Version";

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
 * The CAL service api: owns the base URL, the reducer path and the cache tags, but no endpoints.
 * Use-case packages call `injectEndpoints` on it — which mutates and returns this same object, so
 * cache, reducer and middleware stay unified across them.
 *
 * Register this in the store; never call endpoints on it. Only the injected reference returned by
 * a use-case package carries the endpoint types.
 */
export const calApi = createApi({
  reducerPath: "calApi",
  baseQuery: calBaseQuery,
  tagTypes: [...TOKEN_TAGS],
  endpoints: () => ({}),
});

export type CalApi = typeof calApi;
