import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { lastBlock } from "@ledgerhq/coin-aleo/logic";
import { getCurrencyConfiguration } from "../../../config/index";
import type { AleoCoinConfig } from "../types";

/**
 * Register this api in an app's `rtkQueryApi` registry before consuming its hooks there —
 * without its reducer and middleware in the store the queries never run.
 */
export const aleoApi = createApi({
  reducerPath: "aleoApi",
  baseQuery: fakeBaseQuery<Error>(),
  endpoints: build => ({
    getLastBlockHeight: build.query<number, string>({
      queryFn: async currencyId => {
        try {
          // The coin config lives in the currency configuration, not on the currency itself.
          const config = getCurrencyConfiguration<AleoCoinConfig>(currencyId);
          const { height } = await lastBlock(config);
          return { data: height };
        } catch (error) {
          return { error: error instanceof Error ? error : new Error(String(error)) };
        }
      },
      // The chain tip is stale as soon as it lands, so there is nothing worth replaying to a
      // later subscriber: drop it as soon as the last one goes away.
      keepUnusedDataFor: 0,
    }),
  }),
});

export const { useGetLastBlockHeightQuery } = aleoApi;
