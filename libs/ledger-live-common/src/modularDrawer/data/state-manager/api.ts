import { createApi, fetchBaseQuery, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { convertApiAssets } from "@ledgerhq/cryptoassets";
import { AssetsData, RawApiResponse } from "../entities";
import { getEnv } from "@ledgerhq/live-env";

export enum AssetsDataTags {
  Assets = "Assets",
}

export interface GetAssetsDataParams {
  search?: string;
  currencyIds?: string[];
  useCase?: string;
  product: "llm" | "lld";
  version: string;
}

export interface PageParam {
  cursor?: string;
}

export interface AssetsDataWithPagination extends AssetsData {
  pagination: {
    nextCursor?: string;
  };
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

export const assetsDataApi = createApi({
  reducerPath: "assetsDataApi",
  baseQuery: fetchBaseQuery({
    baseUrl: __DEV__ ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD"),
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
            queryArg?.currencyIds.length > 0 &&
            !queryArg?.useCase && { currencyIds: queryArg.currencyIds }),
          ...(queryArg?.search && { search: queryArg.search }),
          product: queryArg.product,
          minVersion: queryArg.version,
          additionalData: ["apy", "marketTrend"],
        };

        return {
          url: "assets",
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
  }),
});

export const { useGetAssetsDataInfiniteQuery } = assetsDataApi;
