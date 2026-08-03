// Countervalues Service (CVS): base query, cache tags and the endpoint-less api its use cases inject
// into. `LEDGER_COUNTERVALUES_API` also backs `marketApi`, `counterValuesApi` and `ofacGeoBlockApi`
// in live-common — when those migrate to domain/api they inject here rather than adding a createApi.

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
 * Thunk `extraArgument` contract for every Countervalues-Service-backed api. The app supplies the
 * resolved CVS URL at store configuration time, so this package owns no env/config dependency.
 */
export const CvsApiExtraSchema = z.object({
  countervaluesServiceUrl: z.string().min(1),
});

/** Slice of the Redux thunk `extraArgument` owned by the Countervalues Service. */
export type CvsApiExtra = z.infer<typeof CvsApiExtraSchema>;

/**
 * RTK Query cache tags for CVS fiat data. `tagTypes` is only accepted by `createApi`, never by
 * `injectEndpoints`, so this file has to declare the full set upfront.
 */
export const FIAT_TAGS = ["SupportedFiats"] as const;

/** Max retries for transient Countervalues Service request failures. */
const MAX_RETRIES = 3;

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
 * The Countervalues Service api: owns the base URL, the reducer path and the cache tags, but no
 * endpoints. Use-case packages call `injectEndpoints` on it — which mutates and returns this same
 * object, so cache, reducer and middleware stay unified across them.
 *
 * Register this in the store; never call endpoints on it. Only the injected reference returned by
 * a use-case package carries the endpoint types.
 */
export const countervaluesApi = createApi({
  reducerPath: "countervaluesApi",
  baseQuery: cvsBaseQuery,
  tagTypes: [...FIAT_TAGS],
  endpoints: () => ({}),
});

export type CountervaluesApi = typeof countervaluesApi;
