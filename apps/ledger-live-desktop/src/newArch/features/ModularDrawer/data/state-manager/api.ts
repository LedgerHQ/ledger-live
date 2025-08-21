import { createApi, fetchBaseQuery, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { convertApiAssets } from "@ledgerhq/cryptoassets";
import { AssetsData, RawApiResponse } from "../entities";

export enum AssetsDataTags {
  Assets = "Assets",
}

export interface GetAssetsDataParams {
  cursor?: string;
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
  baseQuery: fetchBaseQuery({ baseUrl: "https://dada.api.ledger-test.com/v1/" }),
  tagTypes: [AssetsDataTags.Assets],
  endpoints: build => ({
    getAssetsData: build.query<AssetsDataWithPagination, GetAssetsDataParams>({
      query: ({ cursor }) => ({
        url: "assets",
        ...(cursor && { params: { cursor } }),
      }),
      providesTags: [AssetsDataTags.Assets],
      transformResponse: transformAssetsResponse,
    }),
  }),
});

export const { useGetAssetsDataQuery } = assetsDataApi;
