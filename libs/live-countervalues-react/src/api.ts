import { getEnv } from "@ledgerhq/live-env";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const countervaluesByMarketcapApi = createApi({
  reducerPath: "countervaluesMarketcapApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("LEDGER_COUNTERVALUES_API"),
  }),
  endpoints: build => ({
    getIdsByMarketcap: build.query<string[], void>({
      query: () => ({
        url: "/v3/supported/crypto",
      }),
      keepUnusedDataFor: (30 * 60 * 1000) / 1000,
    }),
  }),
});

export const { useGetIdsByMarketcapQuery } = countervaluesByMarketcapApi;
