import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@shared/env";
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
import { buildMarketListParams, getNextMarketListPage } from "../utils/marketListQueryArg";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import {
  GlobalMarketData,
  GlobalMarketDataRequestParams,
  GlobalMarketDataResponseSchema,
  MarketChartApiResponseSchema,
  MarketDataTags,
  MarketListQueryArg,
  MarketPerformersQueryParams,
  MarketsByLedgerIdsQueryParams,
  MarketTrendingCategory,
  TrendingCategoriesResponseSchema,
  TrendingCurrenciesResponseSchema,
  TrendingPerformersQueryParams,
} from "./types";
import { currencyFormatter, format, formatPerformer } from "../utils/currencyFormatter";

const MAX_TRENDING_CATEGORIES = 5;

// /v3/markets only accepts these pageSize values.
const ALLOWED_MARKET_PAGE_SIZES = [1, 5, 20, 50] as const;
const MAX_MARKETS_PAGE_SIZE = ALLOWED_MARKET_PAGE_SIZES.at(-1) ?? 50;

function marketPageSize(count: number): (typeof ALLOWED_MARKET_PAGE_SIZES)[number] {
  return ALLOWED_MARKET_PAGE_SIZES.find(size => size >= count) ?? MAX_MARKETS_PAGE_SIZE;
}

function chunkLedgerIds(ledgerIds: string[]): string[][] {
  const chunks: string[][] = [];
  for (let start = 0; start < ledgerIds.length; start += MAX_MARKETS_PAGE_SIZE) {
    chunks.push(ledgerIds.slice(start, start + MAX_MARKETS_PAGE_SIZE));
  }
  return chunks;
}

function isMarketItemList(data: unknown): data is MarketItemResponse[] {
  return Array.isArray(data);
}

function marketsFromPages(
  pages: readonly { error?: unknown; data?: unknown }[],
): MarketItemResponse[] | undefined {
  const markets: MarketItemResponse[] = [];
  let succeeded = false;
  for (const page of pages) {
    if (page.error || !isMarketItemList(page.data)) continue;
    succeeded = true;
    markets.push(...page.data);
  }
  return succeeded ? markets : undefined;
}

export type RequestedLedgerMarket = {
  ledgerId: string;
  market: MarketItemResponse;
};

function marketForRequestedLedgerId(
  markets: MarketItemResponse[],
  ledgerId: string,
): MarketItemResponse | undefined {
  let fallback: MarketItemResponse | undefined;
  for (const market of markets) {
    if (!market.ledgerIds.includes(ledgerId)) continue;
    if (market.id === ledgerId) return market;
    fallback ??= market;
  }
  return fallback;
}

export function pairMarketsWithRequestedLedgerIds(
  markets: MarketItemResponse[],
  ledgerIds: string[],
): RequestedLedgerMarket[] {
  return ledgerIds.flatMap(ledgerId => {
    const market = marketForRequestedLedgerId(markets, ledgerId);
    return market ? [{ ledgerId, market }] : [];
  });
}

function orderMarketsByLedgerIds(
  markets: MarketItemResponse[],
  ledgerIds: string[],
): MarketItemResponse[] {
  return pairMarketsWithRequestedLedgerIds(markets, ledgerIds).map(({ market }) => market);
}

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
    MarketDataTags.TrendingPerformers,
    MarketDataTags.MarketList,
  ],
  endpoints: build => ({
    getMarketList: build.infiniteQuery<MarketCurrencyData[], MarketListQueryArg, number>({
      query: ({ queryArg, pageParam }) => ({
        url: "/v3/markets",
        params: buildMarketListParams({ queryArg, page: pageParam }),
      }),
      transformResponse: (response: MarketItemResponse[]) => currencyFormatter(response),
      providesTags: [MarketDataTags.MarketList],
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages, lastPageParam, _allPageParams, queryArg) =>
          getNextMarketListPage(lastPage, allPages, lastPageParam, queryArg),
      },
      keepUnusedDataFor: (REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH) / 1000,
    }),
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
    getMarketsByLedgerIds: build.query<MarketItemResponse[], MarketsByLedgerIdsQueryParams>({
      async queryFn({ ledgerIds, counterCurrency }, _api, _extra, fetchWithBQ) {
        const pages = await Promise.all(
          chunkLedgerIds(ledgerIds).map(chunk =>
            fetchWithBQ({
              url: "/v3/markets",
              params: {
                to: counterCurrency,
                ledgerIds: chunk.join(","),
                pageSize: marketPageSize(chunk.length),
              },
            }),
          ),
        );

        const markets = marketsFromPages(pages);
        if (!markets) {
          return {
            error: pages.find(page => page.error)?.error ?? {
              status: "CUSTOM_ERROR",
              error: "Invalid markets response",
            },
          };
        }

        return { data: orderMarketsByLedgerIds(markets, ledgerIds) };
      },
      providesTags: [MarketDataTags.CurrencyData],
      keepUnusedDataFor: (REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH) / 1000,
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
    getTrendingPerformers: build.query<MarketItemPerformer[], TrendingPerformersQueryParams>({
      async queryFn({ counterCurrency }, _api, _extra, fetchWithBQ) {
        const trendingResult = await fetchWithBQ("/v3/currencies/trending");
        if (trendingResult.error) return { error: trendingResult.error };

        const parsed = TrendingCurrenciesResponseSchema.safeParse(trendingResult.data);
        if (!parsed.success) {
          log("market", "Invalid trending currencies response schema:", {
            errors: parsed.error.issues,
          });
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: `[Market API] Trending currencies schema validation failed: ${parsed.error.issues
                .map(e => `${e.path.join(".")}: ${e.message}`)
                .join(", ")}`,
            },
          };
        }

        const supportedIds = parsed.data.filter(currency => currency.supported).map(({ id }) => id);
        if (supportedIds.length === 0) return { data: [] };

        const marketsResult = await fetchWithBQ({
          url: "/v3/markets",
          params: {
            to: counterCurrency,
            ids: supportedIds.join(","),
            pageSize: MAX_MARKETS_PAGE_SIZE,
          },
        });
        if (marketsResult.error) return { error: marketsResult.error };

        const marketById = new Map(
          (marketsResult.data as MarketItemResponse[]).map(item => [item.id, item]),
        );
        // Preserve the trending order returned by the API rather than the markets response order.
        const data = supportedIds
          .map(id => marketById.get(id))
          .filter((item): item is MarketItemResponse => item !== undefined)
          .map(formatPerformer);

        return { data };
      },
      providesTags: [MarketDataTags.TrendingPerformers],
      keepUnusedDataFor: REFETCH_TIME_ONE_MINUTE / 1000,
    }),
  }),
});

export const {
  useGetMarketListInfiniteQuery,
  useGetMarketPerformersQuery,
  useGetMarketsByLedgerIdsQuery,
  useGetCurrencyDataQuery,
  useGetAssetChartDataQuery,
  useGetGlobalMarketDataQuery,
  useGetTrendingCategoriesQuery,
  useGetTrendingPerformersQuery,
} = marketApi;
