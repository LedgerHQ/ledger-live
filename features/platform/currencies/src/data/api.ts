import { cvsApi, resolveSupportedFiats } from "@domain/api-currencies";
import { setSupportedFiats } from "./slice";

/**
 * Binds the CVS `getSupportedFiats` query to the `supportedFiats` slice: on each
 * fulfilled query the raw tickers are resolved + OFAC-filtered and pushed into the
 * slice. The binding lives here (feature layer) — not in `@domain/api-currencies` —
 * because the module boundaries forbid the domain layer from depending on a feature.
 */
export const supportedFiatsApi = cvsApi.enhanceEndpoints({
  endpoints: {
    getSupportedFiats: {
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setSupportedFiats(resolveSupportedFiats(data)));
        } catch {
          // query rejected: keep the previous supported fiats
        }
      },
    },
  },
});

export const { useGetSupportedFiatsQuery } = supportedFiatsApi;
