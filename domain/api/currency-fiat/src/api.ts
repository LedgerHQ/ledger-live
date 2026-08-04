import type { FiatCurrency } from "@domain/entity-currency-fiat";
import { setFiats, setFiatsReady } from "@domain/entity-currency-fiat";
import { countervaluesApi } from "@shared/api-services";
import { resolveSupportedFiats } from "./converter";
import { SupportedFiatsResponseSchema } from "./schema";

/** RTK Query cache tags for the supported-fiats list. */
export const FIAT_TAGS = ["SupportedFiats"] as const;

/**
 * Supported-fiats endpoint, injected into the shared Countervalues Service api.
 *
 * `enhanceEndpoints` registers this use case's own cache tags on that api and `injectEndpoints` adds
 * the endpoint — both mutate and return the same api object, so this reference shares its reducer,
 * middleware and cache with every other CVS use case, while only this one is typed with the endpoint
 * below.
 */
export const currencyFiatApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: FIAT_TAGS })
  .injectEndpoints({
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
