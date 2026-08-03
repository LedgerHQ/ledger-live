export type {
  ApiAsset,
  ApiCryptoCurrency,
  ApiTokenCurrency,
  CurrenciesOrder,
  NetworkInfo,
  RawApiResponse,
} from "./schema";

export { AssetCategory, AssetsAdditionalData, AssetsDataTags, ONE_DAY_IN_SECONDS } from "./types";
export type {
  AssetsData,
  AssetsDataWithPagination,
  GetAssetsByCategoryParams,
  GetAssetsDataParams,
  PageParam,
} from "./types";

export { convertApiAssets, transformAssetsResponse } from "./transforms";

export {
  assetsDataApi,
  buildAssetsQueryParams,
  fetchAllAssetCurrencyIdsByCategory,
  fetchAllAssetsByCategory,
  useGetAssetCurrencyIdsByCategoryQuery,
  useGetAssetDataQuery,
  useGetAssetsByCategoryQuery,
  useGetAssetsDataInfiniteQuery,
  useGetChunkedAssetsDataQuery,
} from "./api";

export {
  getApiErrorStatus,
  isApiError,
  isFetchBaseQueryError,
  isNetworkError,
  parseError,
} from "./errors";
export type { ErrorInfo } from "./errors";

/*
 * Consumed by the feature layer's page-merging and discovery helpers, so exported rather than
 * kept internal despite living under internals/.
 */
export { chunkCurrencyIds } from "./internals/chunkCurrencyIds";
export type { CurrencyIdChunks } from "./internals/chunkCurrencyIds";
export { deepMergeCryptoAssets } from "./internals/deepMergeCryptoAssets";
export { mergeAssetsDataPages } from "./internals/mergeAssetsDataPages";
export { dadaIdToMarketId } from "./internals/market";
export type { MarketItemResponse, PartialMarketItemResponse } from "./internals/market";
