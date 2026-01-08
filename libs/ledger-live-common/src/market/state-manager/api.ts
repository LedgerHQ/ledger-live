import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import { MarketItemPerformer, MarketItemResponse } from "../utils/types";
import { getRange } from "../utils";
import { REFETCH_TIME_ONE_MINUTE } from "../utils/timers";
import { MarketDataTags, MarketPerformersQueryParams } from "./types";
import { formatPerformer } from "../utils/currencyFormatter";

export const marketApi = createApi({
  reducerPath: "marketApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("LEDGER_COUNTERVALUES_API"),
  }),
  tagTypes: [MarketDataTags.Performers],
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
  }),
});

export const { useGetMarketPerformersQuery } = marketApi;
