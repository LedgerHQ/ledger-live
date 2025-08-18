import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { convertApiAssets } from "@ledgerhq/cryptoassets";
import { AssetsData, RawApiResponse } from "../entities";

function transformAssetsResponse(response: RawApiResponse): AssetsData {
  const enrichedCryptoOrTokenCurrencies = convertApiAssets(response.cryptoOrTokenCurrencies);

  return {
    ...response,
    cryptoOrTokenCurrencies: enrichedCryptoOrTokenCurrencies,
  };
}

export const assetsDataApi = createApi({
  reducerPath: "assetsDataApi",
  baseQuery: fetchBaseQuery({ baseUrl: "https://dada.api.ledger-test.com/v1/" }),
  tagTypes: ["Assets"],
  endpoints: build => ({
    getAssetsData: build.query<AssetsData, {}>({
      query: () => "assets",
      providesTags: ["Assets"],
      transformResponse: transformAssetsResponse,
    }),
  }),
});

export const { useGetAssetsDataQuery } = assetsDataApi;
