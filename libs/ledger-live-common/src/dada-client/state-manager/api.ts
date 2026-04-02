import {
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query/react";
import { convertApiAssets } from "@ledgerhq/cryptoassets";
import { RawApiResponse } from "../entities";
import { getEnv } from "@ledgerhq/live-env";
import {
  AssetsAdditionalData,
  AssetsDataTags,
  AssetsDataWithPagination,
  GetAssetsDataParams,
  GetAssetsByCategoryParams,
  ONE_DAY_IN_SECONDS,
  PageParam,
} from "./types";

const ALLOWED_DADA_HOSTS = new Set(["dada.api.ledger.com", "dada.api.ledger-test.com"]);

function assertDadaApiUrl(url: URL): void {
  if (!ALLOWED_DADA_HOSTS.has(url.hostname)) {
    throw new Error(`Blocked request to untrusted host: ${url.hostname}`);
  }
}

function transformAssetsResponse(
  response: RawApiResponse,
  meta?: FetchBaseQueryMeta,
): AssetsDataWithPagination {
  const enrichedCryptoOrTokenCurrencies = convertApiAssets(response.cryptoOrTokenCurrencies);

  const nextCursor = meta?.response?.headers.get("x-ledger-next") || undefined;

  return {
    ...response,
    cryptoOrTokenCurrencies: enrichedCryptoOrTokenCurrencies,
    pagination: {
      nextCursor,
    },
  };
}

export async function fetchAllAssetsByCategory(
  queryArg: GetAssetsByCategoryParams,
): Promise<QueryReturnValue<string[], FetchBaseQueryError, FetchBaseQueryMeta | undefined>> {
  try {
    const baseUrl = queryArg.isStaging ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD");
    const allTickers: string[] = [];
    let cursor: string | undefined;

    do {
      const url = new URL(`${baseUrl}/assets`);
      url.searchParams.set("categories", queryArg.category);
      url.searchParams.set("product", queryArg.product);
      url.searchParams.set("pageSize", "100");
      url.searchParams.set("minVersion", queryArg.version);
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }

      assertDadaApiUrl(url);
      const response = await fetch(url.toString());

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: `Failed to fetch assets by category: ${response.statusText}`,
          },
        };
      }

      const data: RawApiResponse = await response.json();
      allTickers.push(...Object.values(data.cryptoAssets).map(a => a.ticker));
      cursor = response.headers.get("x-ledger-next") || undefined;
    } while (cursor);

    return { data: allTickers };
  } catch (error) {
    return {
      error: {
        status: "FETCH_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

export const assetsDataApi = createApi({
  reducerPath: "assetsDataApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "", // Will be overridden in query
  }),
  tagTypes: [AssetsDataTags.Assets],
  endpoints: build => ({
    getAssetsData: build.infiniteQuery<AssetsDataWithPagination, GetAssetsDataParams, PageParam>({
      query: ({ pageParam, queryArg }) => {
        const params = {
          pageSize: 100,
          ...(pageParam?.cursor && { cursor: pageParam.cursor }),
          ...(queryArg?.useCase && { transaction: queryArg.useCase }),
          ...(queryArg?.currencyIds &&
            queryArg?.currencyIds.length > 0 && { currencyIds: queryArg.currencyIds }),
          ...(queryArg?.search && { search: queryArg.search }),
          product: queryArg.product,
          minVersion: queryArg.version,
          ...(queryArg?.includeTestNetworks && {
            includeTestNetworks: queryArg.includeTestNetworks,
          }),
          additionalData: queryArg.additionalData || [
            AssetsAdditionalData.Apy,
            AssetsAdditionalData.MarketTrend,
          ],
        };

        const baseUrl = queryArg.isStaging ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD");

        return {
          url: `${baseUrl}/assets`,
          params,
        };
      },
      providesTags: [AssetsDataTags.Assets],
      transformResponse: transformAssetsResponse,
      infiniteQueryOptions: {
        initialPageParam: {
          cursor: "",
        },
        getNextPageParam: lastPage => {
          if (lastPage.pagination.nextCursor) {
            return {
              cursor: lastPage.pagination.nextCursor,
            };
          } else {
            return undefined;
          }
        },
      },
    }),
    getAssetData: build.query<AssetsDataWithPagination, GetAssetsDataParams>({
      query: queryArg => {
        const params = {
          pageSize: 1,
          ...(queryArg?.currencyIds &&
            queryArg?.currencyIds.length > 0 && { currencyIds: queryArg.currencyIds }),
          product: queryArg.product,
          minVersion: queryArg.version,
          additionalData: queryArg.additionalData || [
            AssetsAdditionalData.Apy,
            AssetsAdditionalData.MarketTrend,
          ],
        };

        const baseUrl = queryArg.isStaging ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD");

        return {
          url: `${baseUrl}/assets`,
          params,
        };
      },
      providesTags: [AssetsDataTags.Assets],
      transformResponse: transformAssetsResponse,
    }),
    getAssetsByCategory: build.query<string[], GetAssetsByCategoryParams>({
      queryFn: async queryArg => {
        return fetchAllAssetsByCategory(queryArg);
      },
      keepUnusedDataFor: ONE_DAY_IN_SECONDS,
    }),
  }),
});

export const { useGetAssetsDataInfiniteQuery, useGetAssetDataQuery, useGetAssetsByCategoryQuery } =
  assetsDataApi;
