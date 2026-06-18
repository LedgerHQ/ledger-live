import { createApi, fetchBaseQuery, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import { SupportedFiatsResponseSchema, type SupportedFiatTickers } from "./schema";

/** Cache tags exposed by {@link cvsApi}. */
export enum CvsTags {
  SupportedFiats = "SupportedFiats",
}

/**
 * Thunk `extraArgument` contract for {@link cvsApi}. The app supplies the
 * Countervalues Service base URL at store configuration time, so this package
 * owns no env/config dependency.
 */
export interface CvsApiExtra {
  cvsBaseUrl: string;
}

/** Builds the {@link CvsApiExtra} object the store passes as thunk `extraArgument`. */
export function cvsApiExtra(cvsBaseUrl: string): CvsApiExtra {
  return { cvsBaseUrl };
}

/** Resolves the base URL from the store's thunk `extraArgument` at request time. */
const cvsBaseQuery: BaseQueryFn = (args, api, extraOptions) =>
  fetchBaseQuery({ baseUrl: (api.extra as CvsApiExtra).cvsBaseUrl })(args, api, extraOptions);

/** RTK Query API for the Countervalues Service (CVS). */
export const cvsApi = createApi({
  reducerPath: "cvsApi",
  baseQuery: cvsBaseQuery,
  tagTypes: [CvsTags.SupportedFiats],
  endpoints: build => ({
    getSupportedFiats: build.query<SupportedFiatTickers, void>({
      query: () => ({
        url: "/v3/supported/fiat",
        method: "GET",
        headers: { accept: "application/json" },
      }),
      transformResponse: (raw: unknown) => SupportedFiatsResponseSchema.parse(raw),
      providesTags: [CvsTags.SupportedFiats],
    }),
  }),
});

export const { useGetSupportedFiatsQuery } = cvsApi;
