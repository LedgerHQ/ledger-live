import { useMemo, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useAssetSelection } from "./useAssetSelection";
import { haveOneCommonProvider } from "@ledgerhq/live-common/modularDrawer/utils/index";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";

interface UseModularDrawerFilteringProps {
  currencyIds: string[];
  assets?: AssetData[];
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
  isSuccess: boolean;
}

export function useModularDrawerFiltering({
  currencyIds,
  assets,
  sortedCryptoCurrencies,
  isSuccess,
}: UseModularDrawerFilteringProps) {
  const { assetsToDisplay, currencyIdsSet, setAssetsToDisplay } = useAssetSelection(
    currencyIds,
    sortedCryptoCurrencies,
  );

  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>();

  // TODO assets would be of length 1 if there is a common provider
  const hasOneCurrency = useMemo(() => {
    if (!isSuccess || !assets) return false;
    return haveOneCommonProvider(currencyIds, assets);
  }, [currencyIds, assets, isSuccess]);

  return {
    assetsToDisplay,
    currencyIdsSet,
    setAssetsToDisplay,
    networksToDisplay,
    setNetworksToDisplay,
    hasOneCurrency,
  };
}
