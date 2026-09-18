import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { lastBlock } from "@ledgerhq/coin-aleo/logic";
import { getCurrencyConfiguration } from "../../../config/index";
import type { AleoCoinConfig } from "../types";

export const aleoApi = createApi({
  reducerPath: "aleoApi",
  baseQuery: fakeBaseQuery<Error>(),
  endpoints: build => ({
    getLastBlockHeight: build.query<number, string>({
      queryFn: async currencyId => {
        try {
          const config = getCurrencyConfiguration<AleoCoinConfig>(currencyId);
          const { height } = await lastBlock(config);
          return { data: height };
        } catch (error) {
          return { error: error instanceof Error ? error : new Error(String(error)) };
        }
      },
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetLastBlockHeightQuery } = aleoApi;
