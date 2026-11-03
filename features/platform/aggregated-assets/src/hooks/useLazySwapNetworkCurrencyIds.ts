import { useCallback } from "react";
import { selectAssetCurrencyIds } from "../currencySelection";
import { useLazyAllAssetGroupsData, type LazyAssetDataOptions } from "./useLazyAssetData";

export function useLazySwapNetworkCurrencyIds(options: LazyAssetDataOptions) {
  const getAllAssetGroupsData = useLazyAllAssetGroupsData(options);

  const getSwapNetworkCurrencyIds = useCallback(
    async (currencyId: string, ledgerIds: readonly string[] = []): Promise<string[]> => {
      if (ledgerIds.length < 2) return [currencyId];

      const swappableAssets = await getAllAssetGroupsData({
        currencyIds: [...ledgerIds],
        useCase: "swap",
      });
      const networkCurrencyIds = swappableAssets
        ? selectAssetCurrencyIds(swappableAssets, currencyId)
        : [];
      return networkCurrencyIds.length > 0 ? networkCurrencyIds : [currencyId];
    },
    [getAllAssetGroupsData],
  );

  return { getSwapNetworkCurrencyIds };
}
