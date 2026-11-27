import type { MarketIndexGlobal } from "@domain/entity-market-index-global";
import { countervaluesApi } from "@shared/api-services";
import { describeSchemaFailure } from "./describeSchemaFailure";
import { GlobalMarketResponseSchema } from "./schema";
import { transformGlobalMarketResponse } from "./transforms";
import type { GlobalMarketDataRequestParams, GlobalMarketResponse } from "./types";

/** RTK Query cache tags for the global market index. */
export const MARKET_INDEX_GLOBAL_TAGS = ["GlobalData"] as const;

const THREE_MINUTES_IN_SECONDS = 3 * 60;

/** Global market endpoint, injected into the shared Countervalues service api. */
export const marketIndexGlobalApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_INDEX_GLOBAL_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getGlobalMarketData: build.query<MarketIndexGlobal, GlobalMarketDataRequestParams>({
        query: ({ counterCurrency }) => ({
          url: "/v3/markets/global",
          params: { to: counterCurrency },
        }),
        providesTags: ["GlobalData"],
        rawResponseSchema: GlobalMarketResponseSchema,
        transformResponse: (raw: GlobalMarketResponse) => transformGlobalMarketResponse(raw),
        catchSchemaFailure: describeSchemaFailure,
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: THREE_MINUTES_IN_SECONDS,
      }),
    }),
  });

export const { useGetGlobalMarketDataQuery } = marketIndexGlobalApi;

export type MarketIndexGlobalApi = typeof marketIndexGlobalApi;
