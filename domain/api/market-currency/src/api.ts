import {
  pairMarketsWithRequestedLedgerIds,
  type MarketCurrency,
  type MarketListQueryArg,
} from "@domain/entity-market-currency";
import type { FetchBaseQueryError, QueryReturnValue } from "@reduxjs/toolkit/query";
import { countervaluesApi } from "@shared/api-services";
import { describeSchemaFailure } from "./internals/describeSchemaFailure";
import { buildMarketListParams, getNextMarketListPage } from "./marketList";
import { formatMarketCurrency, formatMarketCurrencies } from "./transforms";
import { chunkLedgerIds, marketPageSize, marketsFromPages } from "./ledgerIdPages";
import { MarketItemListResponseSchema, type MarketItemResponse } from "./schema";
import type { MarketCurrencyRequestParams, MarketsByLedgerIdsQueryParams } from "./types";

/** RTK Query cache tags for the market currency list and its lookups. */
export const MARKET_CURRENCY_TAGS = ["MarketList", "CurrencyData"] as const;

// `keepUnusedDataFor` is in seconds: the legacy client kept this data 3 minutes.
const THREE_MINUTES_IN_SECONDS = 3 * 60;

/**
 * A `getMarketsByLedgerIds` page whose body does not match the raw market list fails like a
 * transport error, so it is skipped with the other failed pages and its issues reach the caller.
 */
function validateMarketsPage(
  page: QueryReturnValue<unknown, FetchBaseQueryError>,
): QueryReturnValue<MarketItemResponse[], FetchBaseQueryError> {
  if (page.error) return { error: page.error };

  const parsed = MarketItemListResponseSchema.safeParse(page.data);
  return parsed.success
    ? { data: parsed.data }
    : {
        error: describeSchemaFailure({
          schemaName: "rawResponseSchema",
          issues: parsed.error.issues,
        }),
      };
}

/**
 * Market currency endpoints, injected into the shared Countervalues Service api.
 *
 * `enhanceEndpoints` registers this use case's cache tags on that api and `injectEndpoints` adds the
 * endpoints — both mutate and return the same api object, so these endpoints share its reducer,
 * middleware and cache with every other countervalues use case.
 */
export const marketCurrencyApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: MARKET_CURRENCY_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getMarketList: build.infiniteQuery<MarketCurrency[], MarketListQueryArg, number>({
        query: ({ queryArg, pageParam }) => ({
          url: "/v3/markets",
          params: buildMarketListParams({ queryArg, page: pageParam }),
        }),
        rawResponseSchema: MarketItemListResponseSchema,
        catchSchemaFailure: describeSchemaFailure,
        transformResponse: (response: MarketItemResponse[]) => formatMarketCurrencies(response),
        providesTags: ["MarketList"],
        infiniteQueryOptions: {
          initialPageParam: 0,
          getNextPageParam: (lastPage, allPages, lastPageParam, _allPageParams, queryArg) =>
            getNextMarketListPage(lastPage, allPages, lastPageParam, queryArg),
        },
        // The shared base query retries three times; this endpoint never did.
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: THREE_MINUTES_IN_SECONDS,
      }),
      /**
       * The raw markets of several ledger ids, in request order. The ids go out in chunks of the
       * largest page size; a failed chunk is skipped while the others still count.
       */
      getMarketsByLedgerIds: build.query<MarketItemResponse[], MarketsByLedgerIdsQueryParams>({
        async queryFn({ ledgerIds, counterCurrency }, _api, _extra, fetchWithBQ) {
          const pages = await Promise.all(
            chunkLedgerIds(ledgerIds).map(async chunk =>
              validateMarketsPage(
                await fetchWithBQ({
                  url: "/v3/markets",
                  params: {
                    to: counterCurrency,
                    ledgerIds: chunk.join(","),
                    pageSize: marketPageSize(chunk.length),
                  },
                }),
              ),
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

          const paired = pairMarketsWithRequestedLedgerIds(markets, ledgerIds);
          return { data: paired.map(({ market }) => market) };
        },
        providesTags: ["CurrencyData"],
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: THREE_MINUTES_IN_SECONDS,
      }),
      getCurrencyData: build.query<MarketCurrency | undefined, MarketCurrencyRequestParams>({
        query: ({ id, ledgerIds, counterCurrency }) => ({
          url: "/v3/markets",
          params: {
            to: counterCurrency,
            pageSize: 1,
            limit: 1,
            ...(ledgerIds?.length ? { ledgerIds: ledgerIds.join(",") } : { ids: id }),
          },
        }),
        providesTags: ["CurrencyData"],
        rawResponseSchema: MarketItemListResponseSchema,
        catchSchemaFailure: describeSchemaFailure,
        transformResponse: (response: MarketItemResponse[]) =>
          response?.[0] ? formatMarketCurrency(response[0]) : undefined,
        extraOptions: { maxRetries: 0 },
        keepUnusedDataFor: THREE_MINUTES_IN_SECONDS,
      }),
    }),
  });

export const {
  useGetMarketListInfiniteQuery,
  useGetMarketsByLedgerIdsQuery,
  useGetCurrencyDataQuery,
} = marketCurrencyApi;

export type MarketCurrencyApi = typeof marketCurrencyApi;
