import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import { AssetsAdditionalData, GetTopCryptosParams, TopCrypto } from "./types";

export enum CryptoBannerTags {
  TopCryptos = "TopCryptos",
}

interface RawApiResponse {
  cryptoAssets: Record<string, { id: string; ticker: string; name: string }>;
  markets: Record<
    string,
    {
      price?: number;
      priceChangePercentage24h?: number;
      marketCapRank?: number;
    }
  >;
  currenciesOrder: {
    metaCurrencyIds: string[];
  };
}

export const cryptoBannerApi = createApi({
  reducerPath: "cryptoBannerApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "",
  }),
  tagTypes: [CryptoBannerTags.TopCryptos],
  endpoints: build => ({
    getTopCryptos: build.query<TopCrypto[], GetTopCryptosParams>({
      query: ({ product, version, isStaging = false }: GetTopCryptosParams) => {
        const baseUrl = isStaging ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD");
        const params = {
          pageSize: 5,
          product,
          minVersion: version,
          additionalData: [AssetsAdditionalData.MarketTrend],
        };

        return {
          url: `${baseUrl}/assets`,
          params,
        };
      },
      providesTags: [CryptoBannerTags.TopCryptos],
      transformResponse: (response: RawApiResponse): TopCrypto[] => {
        const data = response;

        const topCryptos = data.currenciesOrder.metaCurrencyIds.slice(0, 5).map(id => {
          const asset = data.cryptoAssets[id];
          const market = data.markets[id];

          return {
            id: asset.id,
            ticker: asset.ticker,
            name: asset.name,
            price: market?.price,
            priceChangePercentage24h: market?.priceChangePercentage24h,
            marketCapRank: market?.marketCapRank,
          };
        });

        return topCryptos;
      },
    }),
  }),
});

export const { useGetTopCryptosQuery } = cryptoBannerApi;
