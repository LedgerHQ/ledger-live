import { useMemo } from "react";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { useAssetsData } from "@ledgerhq/live-common/modularDrawer/hooks/useAssetsData";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import VersionNumber from "react-native-version-number";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

interface AssetsProps {
  currencyIds?: string[];
  searchedValue?: string;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
}

export function useAssets({
  currencyIds,
  searchedValue,
  useCase,
  areCurrenciesFiltered,
}: AssetsProps) {
  const modularDrawerFeature = useFeature("llmModularDrawer");

  const isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );

  const { data, isLoading, isSuccess, isError, error, refetch, loadNext } = useAssetsData({
    search: searchedValue,
    currencyIds,
    product: "llm",
    version: VersionNumber.appVersion,
    useCase,
    areCurrenciesFiltered,
    isStaging,
  });

  const assetsSorted: AssetData[] | undefined = useMemo(() => {
    if (!data?.currenciesOrder.metaCurrencyIds) return undefined;

    return data.currenciesOrder.metaCurrencyIds
      .filter(currencyId => data.cryptoAssets[currencyId])
      .map(currencyId => {
        const firstNetworkId = Object.values(data.cryptoAssets[currencyId].assetsIds)[0];
        return {
          asset: {
            ...data.cryptoAssets[currencyId],
            id: firstNetworkId,
          },
          networks: Object.values(data.cryptoAssets[currencyId].assetsIds)
            .map(assetId => data.cryptoOrTokenCurrencies[assetId])
            .filter(network => network !== undefined),
          interestRates: data.interestRates?.[firstNetworkId],
          market: data.markets?.[firstNetworkId],
        };
      });
  }, [data]);

  const loadingStatus: LoadingStatus = getLoadingStatus({ isLoading, isSuccess, error });

  const sortedCryptoCurrencies = useMemo(() => {
    if (!assetsSorted || !data) return [];

    return assetsSorted
      .map(assetData => data.cryptoOrTokenCurrencies[assetData.asset.id])
      .filter(currency => currency !== undefined);
  }, [assetsSorted, data]);

  return {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
    loadingStatus,
    assetsSorted,
    sortedCryptoCurrencies,
    refetch,
    loadNext,
  };
}
