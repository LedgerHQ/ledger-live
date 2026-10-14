import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getHederaValidators } from "@ledgerhq/coin-hedera/network/utils";
import { HEDERA_VALIDATORS_CACHE_MINUTES } from "@ledgerhq/coin-hedera/constants";
import { getCurrencyConfiguration } from "../../../config";
import type { HederaCoinConfig, HederaValidator } from "../types";

export const hederaApi = createApi({
  reducerPath: "hederaApi",
  baseQuery: fakeBaseQuery<Error>(),
  // getHederaValidators is LRU-cached, so refetching on mount re-reads that cache, not the network.
  refetchOnMountOrArgChange: true,
  endpoints: build => ({
    getValidators: build.query<HederaValidator[], string>({
      queryFn: async currencyId => {
        try {
          // Only the legacy bridge fills coin-hedera's config registry, so pass the config in.
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
