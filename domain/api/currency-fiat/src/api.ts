import type { FiatCurrency } from "@domain/entity-currency-fiat";
import { setFiats, setFiatsReady } from "@domain/entity-currency-fiat";
import { countervaluesApi, FIAT_TAGS } from "@domain/api-services";
import { resolveSupportedFiats } from "./converter";
import { SupportedFiatsResponseSchema } from "./schema";

/**
 * Supported-fiats endpoint, injected into the shared Countervalues Service api.
 * `injectEndpoints` returns that same api object, so this reference shares its reducer, middleware
 * and cache with every other CVS use case — but only this one is typed with the endpoint below.
 */
export const currencyFiatApi = countervaluesApi.injectEndpoints({
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
