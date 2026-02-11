import { getEnv } from "@ledgerhq/live-env";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const THIRTY_MINUTES = 30 * 60;

export const counterValuesByMarketCapApi = createApi({
  reducerPath: "counterValuesByMarketCapApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("LEDGER_COUNTERVALUES_API"),
  }),
  endpoints: build => ({
    getIdsByMarketcap: build.query<string[], void>({
      query: () => ({
        url: "/v3/supported/crypto",
      }),
      keepUnusedDataFor: THIRTY_MINUTES,
    }),
  }),
});

export const { useGetIdsByMarketcapQuery } = counterValuesByMarketCapApi;
