import { useCallback } from "react";
import { selectAssetCurrencyIds } from "../currencySelection";
import { useLazyAssetData, type LazyAssetDataOptions } from "./useLazyAssetData";

export function useLazySwapNetworkCurrencyIds(options: LazyAssetDataOptions) {
  const getAssetData = useLazyAssetData(options);

  const getSwapNetworkCurrencyIds = useCallback(
    async (currencyId: string, ledgerIds: readonly string[] = []): Promise<string[]> => {
      if (ledgerIds.length < 2) return [currencyId];

      const swappableAssets = await getAssetData({ currencyIds: [...ledgerIds], useCase: "swap" });
      const networkCurrencyIds = swappableAssets
        ? selectAssetCurrencyIds(swappableAssets, currencyId)
        : [];
      return networkCurrencyIds.length > 0 ? networkCurrencyIds : [currencyId];
    },
    [getAssetData],
  );

  return { getSwapNetworkCurrencyIds };
}
