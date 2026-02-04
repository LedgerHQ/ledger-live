import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import {
  MarketCurrencyData,
  MarketCurrencyRequestParams,
  MarketItemPerformer,
  MarketItemResponse,
} from "../utils/types";
import { getRange } from "../utils";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "../utils/timers";
import { MarketDataTags, MarketPerformersQueryParams } from "./types";
import { format, formatPerformer } from "../utils/currencyFormatter";

export const countervaluesApi = createApi({
  reducerPath: "countervaluesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("LEDGER_COUNTERVALUES_API"),
  }),
  tagTypes: [MarketDataTags.Performers, MarketDataTags.CurrencyData],
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
    getCurrencyData: build.query<MarketCurrencyData, MarketCurrencyRequestParams>({
      query: ({ id, counterCurrency }) => ({
        url: "/v3/markets",
        params: {
          to: counterCurrency,
          ids: id,
          pageSize: 1,
          limit: 1,
        },
      }),
      providesTags: [MarketDataTags.CurrencyData],
      transformResponse: (response: MarketItemResponse[]) => format(response[0]),
      keepUnusedDataFor: (REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH) / 1000,
    }),
  }),
});

export const { useGetMarketPerformersQuery, useGetCurrencyDataQuery } = countervaluesApi;
