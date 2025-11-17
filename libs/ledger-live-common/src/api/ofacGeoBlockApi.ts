import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";

export const ofacGeoBlockApi = createApi({
  reducerPath: "ofacGeoBlockApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("LEDGER_COUNTERVALUES_API"),
    validateStatus: response => [200, 451].includes(response.status), // Treat both 200 (not blocked) and 451 (blocked) as successful responses
  }),

  endpoints: build => ({
    check: build.query<boolean, void>({
      query: () => ({
        url: "/v3/markets",
      }),
      transformResponse: (response: unknown, meta) => meta?.response?.status === 451,
    }),
  }),
});
