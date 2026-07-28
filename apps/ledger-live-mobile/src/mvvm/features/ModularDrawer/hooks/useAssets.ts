import { useMemo } from "react";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import VersionNumber from "react-native-version-number";
import { useFeature } from "@features/platform-feature-flags";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";
import useEnv from "@features/platform-env";

type DadaAssetsData = NonNullable<ReturnType<typeof useAssetsData>["data"]>;

interface AssetsProps {
  currencyIds?: string[];
  networkIds?: readonly string[];
  searchedValue?: string;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
}

function buildAssetsSorted(data: DadaAssetsData, networkIds?: readonly string[]): AssetData[] {
  const allowedNetworkIds = networkIds === undefined ? undefined : new Set(networkIds);

  return data.currenciesOrder.metaCurrencyIds.flatMap(metaCurrencyId => {
    const asset = data.cryptoAssets[metaCurrencyId];
    if (!asset) return [];

    const assetIdEntries = Object.entries(asset.assetsIds).filter(
      ([networkId]) => allowedNetworkIds?.has(networkId) ?? true,
    );
    const networks = assetIdEntries.flatMap(([, assetId]) => {
      const currency = data.cryptoOrTokenCurrencies[assetId];
      return currency ? [currency] : [];
    });
    const firstCurrency = networks[0];
    if (!firstCurrency) return [];

    return [
      {
        asset: {
          ...asset,
          id: firstCurrency.id,
          assetsIds: Object.fromEntries(assetIdEntries),
        },
        networks,
        interestRates: data.interestRates?.[firstCurrency.id],
        market: data.markets?.[firstCurrency.id],
      },
    ];
  });
}

export function useAssets({
  currencyIds,
  networkIds,
  searchedValue,
  useCase,
  areCurrenciesFiltered,
}: AssetsProps) {
  const isAcceptedCurrency = useAcceptedCurrency();
  const modularDrawerFeature = useFeature("llmModularDrawer");
  const devMode = useEnv("MANAGER_DEV_MODE");

  const isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );

  const { data, isLoading, isSuccess, isError, error, refetch, loadNext } = useAssetsData({
    search: searchedValue,
    currencyIds: networkIds === undefined ? currencyIds : undefined,
    product: "llm",
    version: VersionNumber.appVersion,
    useCase,
    areCurrenciesFiltered: networkIds === undefined ? areCurrenciesFiltered : false,
    isStaging,
    includeTestNetworks: devMode,
  });

  const assetsSorted = useMemo(
    () => (data ? buildAssetsSorted(data, networkIds) : undefined),
    [data, networkIds],
  );

  const loadingStatus: LoadingStatus = getLoadingStatus({ isLoading, isSuccess, error });

  const assetsToDisplay = useMemo(() => {
    if (!assetsSorted || !data) return [];

    return assetsSorted
      .map(({ asset }) => data.cryptoOrTokenCurrencies[asset.id])
      .filter(currency => currency && isAcceptedCurrency(currency));
  }, [assetsSorted, data, isAcceptedCurrency]);

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
