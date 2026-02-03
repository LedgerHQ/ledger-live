import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import {
  MarketCurrencyChartDataRequestParams,
  SupportedCoins,
  MarketCoinDataChart,
  MarketChartApiResponse,
} from "../utils/types";
import { rangeDataTable } from "../utils/rangeDataTable";
import { MarketDataTags } from "./types";

export const marketApi = createApi({
  reducerPath: "marketApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("MARKET_API_URL"),
  }),
  tagTypes: [MarketDataTags.Coins, MarketDataTags.CounterCurrencies, MarketDataTags.ChartData],
  endpoints: build => ({
    getSupportedCoinsList: build.query<SupportedCoins, void>({
      query: () => "/coins/list",
      providesTags: [MarketDataTags.Coins],
      keepUnusedDataFor: 24 * 60 * 60, // 1 day in seconds
    }),
    getSupportedCounterCurrencies: build.query<string[], void>({
      query: () => "/simple/supported_vs_currencies",
      providesTags: [MarketDataTags.CounterCurrencies],
      keepUnusedDataFor: 24 * 60 * 60, // 1 day in seconds
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
      transformResponse: (response: MarketChartApiResponse, meta, { range = "24h" }) => ({
        [range]: response.prices,
      }),
      providesTags: [MarketDataTags.ChartData],
    }),
  }),
});

export const {
  useGetSupportedCoinsListQuery,
  useGetSupportedCounterCurrenciesQuery,
  useGetCurrencyChartDataQuery,
} = marketApi;
