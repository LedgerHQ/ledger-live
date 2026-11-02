import { useCallback } from "react";
import { assetsDataApi, type GetAssetsDataParams } from "@domain/api-aggregated-assets";
import useEnv from "@features/platform-env";

export type LazyAssetDataOptions = Pick<GetAssetsDataParams, "product" | "version" | "isStaging">;

type LazyAssetDataQuery = Pick<GetAssetsDataParams, "currencyIds" | "useCase">;

export function useLazyAssetData({ product, version, isStaging = false }: LazyAssetDataOptions) {
  const devMode = useEnv("MANAGER_DEV_MODE");

  const [triggerGetAssetData] = assetsDataApi.useLazyGetAssetDataQuery();

  return useCallback(
    async (query: LazyAssetDataQuery) => {
      try {
        return await triggerGetAssetData(
          { ...query, product, version, isStaging, includeTestNetworks: devMode },
          true, // prefer cached data
        ).unwrap();
      } catch {
        return undefined;
      }
    },
    [devMode, isStaging, product, triggerGetAssetData, version],
  );
}
