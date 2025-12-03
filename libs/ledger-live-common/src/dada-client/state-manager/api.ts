import { createApi, fetchBaseQuery, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { convertApiAssets } from "@ledgerhq/cryptoassets";
import { RawApiResponse } from "../entities";
import { getEnv } from "@ledgerhq/live-env";
import {
  AssetsAdditionalData,
  AssetsDataTags,
  AssetsDataWithPagination,
  GetAssetsDataParams,
  PageParam,
} from "./types";

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
  }),
});

export const { useGetAssetsDataInfiniteQuery, useGetAssetDataQuery } = assetsDataApi;
