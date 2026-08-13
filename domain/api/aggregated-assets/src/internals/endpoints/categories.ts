import { ONE_DAY_IN_SECONDS } from "../../constants";
import { fetchAllAssetCurrencyIdsByCategory, fetchAllAssetsByCategory } from "../accessors";
import type { GetAssetsByCategoryParams } from "../../types";
import { lookupApi } from "./lookup";

/**
 * Categorisation use case: "what is in category X."
 *
 * Walks every page and keeps one field per asset, so it returns strings rather than entities.
 */
export const categoriesApi = lookupApi.injectEndpoints({
  endpoints: build => ({
    getAssetsByCategory: build.query<string[], GetAssetsByCategoryParams>({
      queryFn: (queryArg, _api, _extraOptions, baseQuery) =>
        fetchAllAssetsByCategory(queryArg, baseQuery),
      keepUnusedDataFor: ONE_DAY_IN_SECONDS,
    }),
    getAssetCurrencyIdsByCategory: build.query<string[], GetAssetsByCategoryParams>({
      queryFn: (queryArg, _api, _extraOptions, baseQuery) =>
        fetchAllAssetCurrencyIdsByCategory(queryArg, baseQuery),
      keepUnusedDataFor: ONE_DAY_IN_SECONDS,
    }),
  }),
});
