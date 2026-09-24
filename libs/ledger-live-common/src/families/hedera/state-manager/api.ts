import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getHederaValidators } from "@ledgerhq/coin-hedera/network/utils";
import { HEDERA_VALIDATORS_CACHE_MINUTES } from "@ledgerhq/coin-hedera/constants";
import type { HederaCoinConfig } from "@ledgerhq/coin-hedera/types/index";
import { getCurrencyConfiguration } from "../../../config";
import type { HederaValidator } from "../types";

export const hederaApi = createApi({
  reducerPath: "hederaApi",
  baseQuery: fakeBaseQuery<Error>(),
  // getHederaValidators is LRU-cached, so refetching on mount re-reads that cache, not the network.
  refetchOnMountOrArgChange: true,
  endpoints: build => ({
    getValidators: build.query<HederaValidator[], string>({
      queryFn: async currencyId => {
        try {
          // Pass config explicitly: the generic framework never seeds coin-hedera's registry (ADR-019).
          const config = getCurrencyConfiguration<HederaCoinConfig>(currencyId);
          return { data: await getHederaValidators({ currencyId, config }) };
        } catch (error) {
          return { error: error instanceof Error ? error : new Error(String(error)) };
        }
      },
      keepUnusedDataFor: HEDERA_VALIDATORS_CACHE_MINUTES * 60,
    }),
  }),
});

export const { useGetValidatorsQuery } = hederaApi;
