import { ONE_DAY_IN_SECONDS } from "../../constants";
import { isFetchBaseQueryError } from "../../errors";
import { buildAssetsQueryParams } from "../../requests";
import { fetchAssetsPage, resolveBaseUrl } from "../requests";
import { transformAssetsResponse } from "../../transforms";
import { allSettled, chunkCurrencyIds, deepMergeCryptoAssets, emptyAssetsData } from "../utils";
import {
  AssetsDataTags,
  type AssetsData,
  type AssetsDataWithPagination,
  type GetAssetsDataParams,
} from "../../types";
import { queryApi } from "./query";

/**
 * Lookup use case: "I have ids, hydrate them."
 *
 * `getChunkedAssetsData` succeeds when *any* chunk resolves — portfolio distribution relies on
 * partial data rather than failing whole.
 */
export const lookupApi = queryApi.injectEndpoints({
  endpoints: build => ({
    getAssetData: build.query<AssetsDataWithPagination, GetAssetsDataParams>({
      query: queryArg => ({
        url: `${resolveBaseUrl(queryArg)}/assets`,
        params: buildAssetsQueryParams(queryArg, { pageSize: 1 }),
      }),
      providesTags: [AssetsDataTags.Assets],
      transformResponse: transformAssetsResponse,
    }),
    getChunkedAssetsData: build.query<AssetsData, GetAssetsDataParams>({
      queryFn: async (queryArg, _api, _extraOptions, baseQuery) => {
        const chunks = chunkCurrencyIds(queryArg.currencyIds ?? []);
        if (chunks.length === 0) return { data: emptyAssetsData() };

        const results = await allSettled(
          chunks.map(chunkIds =>
            fetchAssetsPage(baseQuery, { ...queryArg, currencyIds: chunkIds }),
          ),
        );

        const responses = results.flatMap(r => (r.status === "fulfilled" ? [r.value] : []));

        if (responses.length === 0) {
          const firstRejection = results.find(r => r.status === "rejected");
          const reason = firstRejection?.status === "rejected" ? firstRejection.reason : undefined;
          /* fetchAssetsPage rethrows the base query's error, so an HTTP status survives here. */
          if (isFetchBaseQueryError(reason)) return { error: reason };
          return {
            error: {
              status: "CUSTOM_ERROR" as const,
              error: reason instanceof Error ? reason.message : "All DADA chunks failed",
            },
          };
        }

        const merged = responses.reduce<AssetsData>((acc, res) => {
          deepMergeCryptoAssets(acc.cryptoAssets, res.cryptoAssets);
          Object.assign(acc.networks, res.networks);
          Object.assign(acc.cryptoOrTokenCurrencies, res.cryptoOrTokenCurrencies);
          Object.assign(acc.interestRates, res.interestRates);
          Object.assign(acc.markets, res.markets);
          acc.currenciesOrder.metaCurrencyIds.push(...res.currenciesOrder.metaCurrencyIds);
          return acc;
        }, emptyAssetsData());

        return { data: merged };
      },
      providesTags: [AssetsDataTags.Assets],
      keepUnusedDataFor: ONE_DAY_IN_SECONDS,
    }),
  }),
});
