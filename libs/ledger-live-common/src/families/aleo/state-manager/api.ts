import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getValidators, lastBlock } from "@ledgerhq/coin-aleo/logic";
import { ALEO_VALIDATORS_CACHE_MINUTES } from "@ledgerhq/coin-aleo/constants";
import { getCurrencyConfiguration } from "../../../config/index";
import type { AleoCoinConfig, AleoValidator } from "../types";

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
    getValidators: build.query<AleoValidator[], string>({
      queryFn: async currencyId => {
        try {
          return { data: await getValidators(currencyId) };
        } catch (error) {
          return { error: error instanceof Error ? error : new Error(String(error)) };
        }
      },
      keepUnusedDataFor: ALEO_VALIDATORS_CACHE_MINUTES * 60,
    }),
  }),
});

export const { useGetLastBlockHeightQuery, useGetValidatorsQuery } = aleoApi;
