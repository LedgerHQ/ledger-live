import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";
import {
  MarketAssetChartDataRequestParams,
  MarketCoinDataChart,
  MarketCurrencyData,
  MarketCurrencyRequestParams,
  MarketItemPerformer,
  MarketItemResponse,
} from "../utils/types";
import { getChartRangeSegment, getRange } from "../utils";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import {
  GlobalMarketData,
  GlobalMarketDataRequestParams,
  GlobalMarketDataResponseSchema,
  MarketChartApiResponseSchema,
  MarketDataTags,
  MarketPerformersQueryParams,
  MarketTrendingCategory,
  TrendingCategoriesResponseSchema,
} from "./types";
import { format, formatPerformer } from "../utils/currencyFormatter";

const MAX_TRENDING_CATEGORIES = 5;

export const marketApi = createApi({
  reducerPath: "marketApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("LEDGER_COUNTERVALUES_API"),
  }),
  tagTypes: [
    MarketDataTags.Performers,
    MarketDataTags.CurrencyData,
    MarketDataTags.ChartData,
    MarketDataTags.GlobalData,
    MarketDataTags.TrendingCategories,
  ],
  endpoints: build => ({
    getMarketPerformers: build.query<MarketItemPerformer[], MarketPerformersQueryParams>({
      query: ({ counterCurrency, range, limit = 5, top = 50, sort, supported }) => {
        const sortParam = `${sort === "asc" ? "positive" : "negative"}-price-change-${getRange(range)}`;

        return {
          url: "/v3/markets",
          params: {
            to: counterCurrency,
            limit,
            top,
            sort: sortParam,
            supported,
          },
        };
      },
      providesTags: [MarketDataTags.Performers],
      transformResponse: (response: MarketItemResponse[]) => response.map(formatPerformer),
      keepUnusedDataFor: REFETCH_TIME_ONE_MINUTE / 1000,
    }),
    getCurrencyData: build.query<MarketCurrencyData | undefined, MarketCurrencyRequestParams>({
      query: ({ id, ledgerIds, counterCurrency }) => ({
        url: "/v3/markets",
        params: {
          to: counterCurrency,
          pageSize: 1,
          limit: 1,
          ...(ledgerIds?.length
            ? { ledgerIds: ledgerIds.join(",") }
            : {
                ids: id,
              }),
        },
      }),
      providesTags: [MarketDataTags.CurrencyData],
      transformResponse: (response: MarketItemResponse[]) =>
        response?.[0] ? format(response[0]) : undefined,
      keepUnusedDataFor: (REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH) / 1000,
    }),
    getAssetChartData: build.query<MarketCoinDataChart, MarketAssetChartDataRequestParams>({
      query: ({ id, counterCurrency, range = "24h" }) => ({
        url: `/v3/markets/chart/${getChartRangeSegment(range)}/${encodeURIComponent(id ?? "")}`,
        params: { to: counterCurrency },
      }),
      providesTags: [MarketDataTags.ChartData],
      transformResponse: (response: unknown, _meta, { range = "24h" }): MarketCoinDataChart => {
        const result = MarketChartApiResponseSchema.safeParse(response);

        if (!result.success) {
          log("market", "Invalid chart data response schema:", {
            errors: result.error.issues,
          });
          throw new Error(
            `[Market API] Chart data schema validation failed: ${result.error.issues
              .map(e => `${e.path.join(".")}: ${e.message}`)
              .join(", ")}`,
          );
        }

        return { [range]: result.data.values };
      },
      keepUnusedDataFor: REFETCH_TIME_ONE_MINUTE / 1000,
    }),
    getGlobalMarketData: build.query<GlobalMarketData, GlobalMarketDataRequestParams>({
      query: ({ counterCurrency }) => ({
        url: "/v3/markets/global",
        params: { to: counterCurrency },
      }),
      providesTags: [MarketDataTags.GlobalData],
      transformResponse: (response: unknown): GlobalMarketData => {
        const result = GlobalMarketDataResponseSchema.safeParse(response);

        if (!result.success) {
          log("market", "Invalid global market data response schema:", {
            errors: result.error.issues,
          });
          throw new Error(
            `[Market API] Global market data schema validation failed: ${result.error.issues
              .map(e => `${e.path.join(".")}: ${e.message}`)
              .join(", ")}`,
          );
        }

        return {
          marketCap: result.data.marketCap,
          changePercentage24h: result.data.percentageChanges["1d"] * 100,
        };
      },
      keepUnusedDataFor: (REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH) / 1000,
    }),
    getTrendingCategories: build.query<MarketTrendingCategory[], void>({
      query: () => ({ url: "/v3/categories/trending" }),
      providesTags: [MarketDataTags.TrendingCategories],
      transformResponse: (response: unknown): MarketTrendingCategory[] => {
        const result = TrendingCategoriesResponseSchema.safeParse(response);

        if (!result.success) {
          log("market", "Invalid trending categories response schema:", {
            errors: result.error.issues,
          });
          throw new Error(
            `[Market API] Trending categories schema validation failed: ${result.error.issues
              .map(e => `${e.path.join(".")}: ${e.message}`)
              .join(", ")}`,
          );
        }

        return result.data.slice(0, MAX_TRENDING_CATEGORIES);
      },
      keepUnusedDataFor: (REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH) / 1000,
    }),
  }),
});

export const {
  useGetMarketPerformersQuery,
  useGetCurrencyDataQuery,
  useGetAssetChartDataQuery,
  useGetGlobalMarketDataQuery,
  useGetTrendingCategoriesQuery,
} = marketApi;
