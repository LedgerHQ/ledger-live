import { dadaApi } from "@shared/api-services";
import {
  AssetsDataTags,
  type AssetsData,
  type AssetsDataWithPagination,
  type GetAssetsByCategoryParams,
  type GetAssetsDataParams,
  type PageParam,
} from "./types";
import { ONE_DAY_IN_SECONDS } from "./constants";
import { transformAssetsResponse } from "./transforms";
import { fetchAllAssetCurrencyIdsByCategory, fetchAllAssetsByCategory } from "./accessors";
import { buildAssetsQueryParams } from "./requests";
import { fetchAssetsPage, resolveBaseUrl } from "./internals/requests";
import {
  allSettled,
  chunkCurrencyIds,
  deepMergeCryptoAssets,
  emptyAssetsData,
} from "./internals/utils";

/*
 * `injectEndpoints` adds this use case's endpoints to the shared DADA service api, and
 * `enhanceEndpoints` widens its tag union in place — `injectEndpoints` does not accept `tagTypes`.
 * Both mutate and return the same object, so one reducer, one middleware and one cache slice serve
 * every use case on this backend.
 *
 * That single slice is load-bearing: `createCurrencyDataSelector` hand-scans
 * `state.assetsDataApi.queries` across every cache entry, which is how interest rates and market
 * trend fetched by one query reach a caller that ran a different one.
 */
export const assetsDataApi = dadaApi
  .enhanceEndpoints({ addTagTypes: [AssetsDataTags.Assets] })
  .injectEndpoints({
    endpoints: build => ({
      getAssetsData: build.infiniteQuery<AssetsDataWithPagination, GetAssetsDataParams, PageParam>({
        query: ({ pageParam, queryArg }) => ({
          url: `${resolveBaseUrl(queryArg)}/assets`,
          params: buildAssetsQueryParams(queryArg, { cursor: pageParam?.cursor }),
        }),
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
        query: queryArg => ({
          url: `${resolveBaseUrl(queryArg)}/assets`,
          params: buildAssetsQueryParams(queryArg, { pageSize: 1 }),
        }),
        providesTags: [AssetsDataTags.Assets],
        transformResponse: transformAssetsResponse,
      }),
      getAssetsByCategory: build.query<string[], GetAssetsByCategoryParams>({
        queryFn: async queryArg => {
          return fetchAllAssetsByCategory(queryArg);
        },
        keepUnusedDataFor: ONE_DAY_IN_SECONDS,
      }),
      getAssetCurrencyIdsByCategory: build.query<string[], GetAssetsByCategoryParams>({
        queryFn: async queryArg => {
          return fetchAllAssetCurrencyIdsByCategory(queryArg);
        },
        keepUnusedDataFor: ONE_DAY_IN_SECONDS,
      }),
      getChunkedAssetsData: build.query<AssetsData, GetAssetsDataParams>({
        queryFn: async queryArg => {
          try {
            const chunks = chunkCurrencyIds(queryArg.currencyIds ?? []);
            const baseUrl = resolveBaseUrl(queryArg);

            if (chunks.length === 0) {
              return { data: emptyAssetsData() };
            }

            const results = await allSettled(
              chunks.map(chunkIds =>
                fetchAssetsPage(baseUrl, { ...queryArg, currencyIds: chunkIds }),
              ),
            );

            const responses = results.flatMap(r => (r.status === "fulfilled" ? [r.value] : []));

            if (responses.length === 0) {
              const firstError = results.find(r => r.status === "rejected");
              const reason = firstError?.status === "rejected" ? firstError.reason : undefined;
              return {
                error: {
                  status: "FETCH_ERROR",
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
          } catch (error) {
            return {
              error: {
                status: "FETCH_ERROR",
                error: error instanceof Error ? error.message : "Unknown error",
              },
            };
          }
        },
        providesTags: [AssetsDataTags.Assets],
        keepUnusedDataFor: ONE_DAY_IN_SECONDS,
      }),
    }),
  });

export const {
  useGetAssetsDataInfiniteQuery,
  useGetAssetDataQuery,
  useGetAssetsByCategoryQuery,
  useGetAssetCurrencyIdsByCategoryQuery,
  useGetChunkedAssetsDataQuery,
} = assetsDataApi;
