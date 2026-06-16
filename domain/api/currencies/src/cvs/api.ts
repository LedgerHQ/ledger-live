import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCvsBaseUrl } from "./config";
import { SupportedFiatsResponseSchema, type SupportedFiatTickers } from "./schema";

/** Cache tags exposed by {@link cvsApi}. */
export enum CvsTags {
  SupportedFiats = "SupportedFiats",
}

/**
 * RTK Query API for the Countervalues Service (CVS).
 *
 * `baseUrl` is left empty: each endpoint resolves its absolute URL from
 * {@link getCvsBaseUrl} at request time so the app can configure it at runtime.
 */
export const cvsApi = createApi({
  reducerPath: "cvsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "" }),
  tagTypes: [CvsTags.SupportedFiats],
  endpoints: build => ({
    getSupportedFiats: build.query<SupportedFiatTickers, void>({
      query: () => ({
        url: `${getCvsBaseUrl()}/v3/supported/fiat`,
        method: "GET",
        headers: { accept: "application/json" },
      }),
      transformResponse: (raw: unknown) => SupportedFiatsResponseSchema.parse(raw),
      providesTags: [CvsTags.SupportedFiats],
    }),
  }),
});

export const { useGetSupportedFiatsQuery } = cvsApi;
