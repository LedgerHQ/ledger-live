import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { FiatCurrency } from "@domain/entity-currency-fiat";
import { setFiats, setFiatsReady } from "@domain/entity-currency-fiat";
import { resolveSupportedFiats } from "./converter";
import { CvsApiExtraSchema, SupportedFiatsResponseSchema } from "./schema";
import type { CvsApiExtra } from "./types";
import { CURRENCY_FIAT_REDUCER_PATH, FIAT_TAGS, MAX_RETRIES } from "./internals";

/**
 * Builds this package's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the
 * Countervalues Service config is incomplete (e.g. an env var resolved to an empty string).
 */
export function cvsApiExtra(extra: CvsApiExtra): CvsApiExtra {
  return CvsApiExtraSchema.parse(extra);
}

/** Extracts the {@link CvsApiExtra} from the `extraArgument` of the API. */
function getCvsExtra(api: { extra: unknown }): CvsApiExtra {
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

/** RTK Query API for the Countervalues Service fiat data. */
export const currencyFiatApi = createApi({
  reducerPath: CURRENCY_FIAT_REDUCER_PATH,
  baseQuery: cvsBaseQuery,
  tagTypes: [...FIAT_TAGS],
  endpoints: build => ({
    getSupportedFiats: build.query<FiatCurrency[], void>({
      query: () => "/v3/supported/fiat",
      transformResponse: (response: unknown) =>
        resolveSupportedFiats(SupportedFiatsResponseSchema.parse(response)),
      providesTags: [...FIAT_TAGS],
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          dispatch(setFiats(data));
        } catch {
          // CVS unreachable — slice keeps its fallback state
        } finally {
          dispatch(setFiatsReady());
        }
      },
    }),
  }),
});

export const { useGetSupportedFiatsQuery } = currencyFiatApi;

export type CurrencyFiatApi = typeof currencyFiatApi;
