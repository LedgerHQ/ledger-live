import { createApi, fetchBaseQuery, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { convertApiAssets } from "@ledgerhq/cryptoassets";
import { AssetsData, RawApiResponse } from "../entities";
import { getEnv } from "@ledgerhq/live-env";

export enum AssetsDataTags {
  Assets = "Assets",
}

export interface GetAssetsDataParams {
  cursor?: string;
  search?: string;
  currencyIds?: string[];
}

export interface AssetsDataWithPagination extends AssetsData {
  pagination: {
    nextCursor?: string;
  };
}

function transformAssetsResponse(
  response: RawApiResponse,
  meta: FetchBaseQueryMeta | undefined,
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
    getAssetsData: build.query<AssetsDataWithPagination, GetAssetsDataParams>({
      query: ({ cursor, search, currencyIds }) => ({
        url: "assets",
        params: {
          ...(cursor && { cursor }),
          ...(search && { search }),
          ...(currencyIds && currencyIds.length > 0 && { currencyIds }),
          pageSize: 100,
        },
      }),
      providesTags: [AssetsDataTags.Assets],
      transformResponse: transformAssetsResponse,
    }),
  }),
});

export const { useGetAssetsDataQuery } = assetsDataApi;
