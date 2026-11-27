import { countervaluesApi } from "@shared/api-services";
import {
  MarketChartApiResponseSchema,
  SupportedChartCounterCurrenciesSchema,
  type MarketChartApiResponse,
  type MarketCoinDataChart,
  type SupportedChartCounterCurrencies,
} from "@domain/entity-market-chart";
import { describeSchemaFailure } from "./internals/describeSchemaFailure";
import { getChartRangeSegment } from "./internals/getChartRangeSegment";
import type { AssetChartDataRequestParams } from "./types";

export const MARKET_CHART_TAGS = ["ChartData", "ChartCounterCurrencies"] as const;

const ONE_MINUTE_IN_SECONDS = 60;
const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
const DEFAULT_RANGE = "24h";

export const marketChartApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_CHART_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getAssetChartData: build.query<MarketCoinDataChart, AssetChartDataRequestParams>({
        query: ({ id, counterCurrency, range = DEFAULT_RANGE }) => ({
          url: `/v3/markets/chart/${getChartRangeSegment(range)}/${encodeURIComponent(id ?? "")}`,
          params: { to: counterCurrency },
        }),
        providesTags: ["ChartData"],
        rawResponseSchema: MarketChartApiResponseSchema,
        transformResponse: (
          raw: MarketChartApiResponse,
          _meta,
          { range = DEFAULT_RANGE },
        ): MarketCoinDataChart => ({ [range]: raw.values }),
        catchSchemaFailure: describeSchemaFailure,
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: ONE_MINUTE_IN_SECONDS,
      }),
      getSupportedChartCounterCurrencies: build.query<SupportedChartCounterCurrencies, void>({
        query: () => "/v3/supported/markets/chart/to",
        providesTags: ["ChartCounterCurrencies"],
        rawResponseSchema: SupportedChartCounterCurrenciesSchema,
        transformResponse: (
          raw: SupportedChartCounterCurrencies,
        ): SupportedChartCounterCurrencies => raw.map(currency => currency.toLowerCase()),
        catchSchemaFailure: describeSchemaFailure,
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: ONE_DAY_IN_SECONDS,
      }),
    }),
  });

export const { useGetAssetChartDataQuery, useGetSupportedChartCounterCurrenciesQuery } =
  marketChartApi;

export type MarketChartApi = typeof marketChartApi;
