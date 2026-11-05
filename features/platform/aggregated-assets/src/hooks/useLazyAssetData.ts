import { useCallback } from "react";
import { assetsDataApi, type GetAssetsDataParams } from "@domain/api-aggregated-assets";
import useEnv from "@features/platform-env";

export type LazyAssetDataOptions = Pick<GetAssetsDataParams, "product" | "version" | "isStaging">;

type LazyAssetDataQuery = Pick<GetAssetsDataParams, "currencyIds" | "useCase">;

type LazyAssetDataTrigger<Result> = (
  queryArg: GetAssetsDataParams,
  preferCacheValue: boolean,
) => { unwrap: () => Promise<Result> };

function useLazyAssetDataQuery<Result>(
  triggerQuery: LazyAssetDataTrigger<Result>,
  { product, version, isStaging = false }: LazyAssetDataOptions,
) {
  const devMode = useEnv("MANAGER_DEV_MODE");

  return useCallback(
    async (query: LazyAssetDataQuery) => {
      try {
        return await triggerQuery(
          { ...query, product, version, isStaging, includeTestNetworks: devMode },
          true, // prefer cached data
        ).unwrap();
      } catch {
        return undefined;
      }
    },
    [devMode, isStaging, product, triggerQuery, version],
  );
}

export function useLazyAssetData(options: LazyAssetDataOptions) {
  const [triggerGetAssetData] = assetsDataApi.useLazyGetAssetDataQuery();
  return useLazyAssetDataQuery(triggerGetAssetData, options);
}

export function useLazyAllAssetGroupsData(options: LazyAssetDataOptions) {
  const [triggerGetChunkedAssetsData] = assetsDataApi.useLazyGetChunkedAssetsDataQuery();
  return useLazyAssetDataQuery(triggerGetChunkedAssetsData, options);
}
