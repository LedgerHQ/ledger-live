import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";
import {
  MarketCurrencyChartDataRequestParams,
  SupportedCoins,
  MarketCoinDataChart,
} from "../utils/types";
import { rangeDataTable } from "../utils/rangeDataTable";
import {
  GcDataTags,
  SupportedCoinsSchema,
  SupportedCounterCurrenciesSchema,
  MarketChartApiResponseSchema,
} from "./types";

function transformSupportedCoinsResponse(response: unknown): SupportedCoins {
  const result = SupportedCoinsSchema.safeParse(response);

  if (!result.success) {
    log("cg-client", "Invalid supported coins response schema:", {
      errors: result.error.issues,
    });
    throw new Error(
      `[GC API] Supported coins schema validation failed: ${result.error.issues
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ")}`,
    );
  }

  return result.data;
}

function transformSupportedCounterCurrenciesResponse(response: unknown): string[] {
  const result = SupportedCounterCurrenciesSchema.safeParse(response);

  if (!result.success) {
    log("cg-client", "Invalid supported counter currencies response schema:", {
      errors: result.error.issues,
    });
    throw new Error(
      `[GC API] Counter currencies schema validation failed: ${result.error.issues
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ")}`,
    );
  }

  return result.data;
}

function transformChartDataResponse(response: unknown, range: string): MarketCoinDataChart {
  const result = MarketChartApiResponseSchema.safeParse(response);

  if (!result.success) {
    log("cg-client", "Invalid chart data response schema:", {
      errors: result.error.issues,
    });
    throw new Error(
      `[GC API] Chart data schema validation failed: ${result.error.issues
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ")}`,
    );
  }

  return { [range]: result.data.prices };
}

export const cgApi = createApi({
  reducerPath: "cgApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("COINGECKO_API_URL"),
  }),
  tagTypes: [GcDataTags.Coins, GcDataTags.CounterCurrencies, GcDataTags.ChartData],
  endpoints: build => ({
    getSupportedCoinsList: build.query<SupportedCoins, void>({
      query: () => "/coins/list",
      providesTags: [GcDataTags.Coins],
      keepUnusedDataFor: 24 * 60 * 60, // 1 day in seconds
      transformResponse: transformSupportedCoinsResponse,
    }),
    getSupportedCounterCurrencies: build.query<string[], void>({
      query: () => "/simple/supported_vs_currencies",
      providesTags: [GcDataTags.CounterCurrencies],
      keepUnusedDataFor: 24 * 60 * 60, // 1 day in seconds
      transformResponse: transformSupportedCounterCurrenciesResponse,
    }),
    getCurrencyChartData: build.query<MarketCoinDataChart, MarketCurrencyChartDataRequestParams>({
      query: ({ id, counterCurrency, range = "24h" }) => {
        const { days, interval } = rangeDataTable[range];
        return {
          url: `/coins/${id}/market_chart`,
          params: {
            vs_currency: counterCurrency,
            days,
            interval,
          },
        };
      },
      transformResponse: (response: unknown, _meta, { range = "24h" }) =>
        transformChartDataResponse(response, range),
      providesTags: [GcDataTags.ChartData],
    }),
  }),
});

export const {
  useGetSupportedCoinsListQuery,
  useGetSupportedCounterCurrenciesQuery,
  useGetCurrencyChartDataQuery,
} = cgApi;
