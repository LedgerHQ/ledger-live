import type { MarketCoinDataChart } from "@domain/entity-market-chart";
import { countervaluesApi } from "@shared/api-services";
import {
  transformMarketChartResponse,
  transformSupportedChartCounterCurrencies,
} from "./transforms";
import { getChartRangeSegment } from "./internals/range";
import type { AssetChartDataArgs } from "./types";

/** RTK Query cache tags for the asset chart use case. */
export const MARKET_CHART_TAGS = ["ChartData", "ChartCounterCurrencies"] as const;

// `keepUnusedDataFor` is in seconds.
const ONE_MINUTE_IN_SECONDS = 60;
const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

/**
 * Chart endpoints, injected into the shared Countervalues Service api.
 *
 * `enhanceEndpoints` registers this use case's own cache tags on that api and `injectEndpoints` adds
 * the endpoints — both mutate and return the same api object, so these endpoints share its reducer,
 * middleware and cache with every other countervalues use case.
 */
export const marketChartApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_CHART_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getAssetChartData: build.query<MarketCoinDataChart, AssetChartDataArgs>({
        query: ({ id, counterCurrency, range = "24h" }) => ({
          url: `/v3/markets/chart/${getChartRangeSegment(range)}/${encodeURIComponent(id ?? "")}`,
          params: { to: counterCurrency },
        }),
        providesTags: ["ChartData"],
        transformResponse: (response: unknown, _meta, { range = "24h" }) =>
          transformMarketChartResponse(response, range),
        // The shared base query retries three times; this endpoint never did.
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: ONE_MINUTE_IN_SECONDS,
      }),
      getSupportedChartCounterCurrencies: build.query<string[], void>({
        query: () => "/v3/supported/markets/chart/to",
        providesTags: ["ChartCounterCurrencies"],
        transformResponse: transformSupportedChartCounterCurrencies,
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: ONE_DAY_IN_SECONDS,
      }),
    }),
  });

export const { useGetAssetChartDataQuery, useGetSupportedChartCounterCurrenciesQuery } =
  marketChartApi;

export type MarketChartApi = typeof marketChartApi;
