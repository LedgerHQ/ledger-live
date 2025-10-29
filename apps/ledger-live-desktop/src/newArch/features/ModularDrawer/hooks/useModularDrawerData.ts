import { useMemo } from "react";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { modularDrawerSearchedSelector } from "~/renderer/reducers/modularDrawer";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";

interface UseModularDrawerDataProps {
  currencyIds?: string[];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
}

export function useModularDrawerData({
  currencyIds,
  useCase,
  areCurrenciesFiltered,
}: UseModularDrawerDataProps) {
  const modularDrawerFeature = useFeature("lldModularDrawer");
  const devMode = useEnv("MANAGER_DEV_MODE");

  const isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );
  const searchedValue = useSelector(modularDrawerSearchedSelector);

  const { data, isLoading, isSuccess, error, loadNext, refetch } = useAssetsData({
    search: searchedValue,
    currencyIds,
    product: "lld",
    version: __APP_VERSION__,
    useCase,
    areCurrenciesFiltered,
    isStaging,
    includeTestNetworks: devMode,
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
            metaCurrencyId: currencyId,
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
    error,
    refetch,
    loadingStatus,
    assetsSorted,
    sortedCryptoCurrencies,
    loadNext,
  };
}
