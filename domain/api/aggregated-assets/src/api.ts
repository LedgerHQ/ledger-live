import { categoriesApi } from "./internals/endpoints/categories";

/*
 * The handle carrying every endpoint's type. `injectEndpoints` mutates and returns the shared base,
 * so the chain in `internals/endpoints` exists only to accumulate types — this is the same object
 * as `dadaBase`. The intermediate handles stay private: each names a partially-built api, and a
 * store configured from one would compile while missing endpoints.
 */
export const assetsDataApi = categoriesApi;

export const {
  useGetAssetsDataInfiniteQuery,
  useGetAssetDataQuery,
  useGetAssetsByCategoryQuery,
  useGetAssetCurrencyIdsByCategoryQuery,
  useGetChunkedAssetsDataQuery,
} = assetsDataApi;
