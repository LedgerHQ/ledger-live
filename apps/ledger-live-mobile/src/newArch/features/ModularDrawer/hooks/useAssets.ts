import { useMemo } from "react";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { useAssetsData } from "@ledgerhq/live-common/modularDrawer/hooks/useAssetsData";
import VersionNumber from "react-native-version-number";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

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
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();
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

  const assetsToDisplay = useMemo(() => {
    if (!assetsSorted || !data) return [];

    return assetsSorted.reduce<CryptoOrTokenCurrency[]>((acc, { asset }) => {
      const currency = data.cryptoOrTokenCurrencies[asset.id];
      if (!currency) return acc;

      const isActive =
        (currency.type === "CryptoCurrency" && !deactivatedCurrencyIds.has(currency.id)) ||
        (currency.type === "TokenCurrency" &&
          !deactivatedCurrencyIds.has(currency.parentCurrency?.id));

      if (isActive) acc.push(currency);
      return acc;
    }, []);
  }, [assetsSorted, data, deactivatedCurrencyIds]);

  return {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
    loadingStatus,
    assetsSorted,
    sortedCryptoCurrencies: assetsToDisplay,
    refetch,
    loadNext,
  };
}
