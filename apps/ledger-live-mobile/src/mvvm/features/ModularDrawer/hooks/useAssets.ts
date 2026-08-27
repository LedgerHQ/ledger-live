import { useMemo } from "react";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { useAssetsData } from "@features/platform-aggregated-assets";
import VersionNumber from "react-native-version-number";
import { useFeature } from "@features/platform-feature-flags";
import { buildAssetsSorted } from "@ledgerhq/live-common/modularDrawer/utils/buildAssetsSorted";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";
import { useSelector } from "~/context/hooks";
import { modularDrawerFlowSelector } from "~/reducers/modularDrawer";
import useEnv from "@features/platform-env";
import type { AssetCategory } from "@domain/api-aggregated-assets";

interface AssetsProps {
  currencyIds?: string[];
  networkIds?: readonly string[];
  categories?: AssetCategory[];
  searchedValue?: string;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
}

export function useAssets({
  currencyIds,
  networkIds,
  categories,
  searchedValue,
  useCase,
  areCurrenciesFiltered,
}: AssetsProps) {
  const flow = useSelector(modularDrawerFlowSelector);
  const isAcceptedCurrency = useAcceptedCurrency({ flow });
  const modularDrawerFeature = useFeature("llmModularDrawer");
  const devMode = useEnv("MANAGER_DEV_MODE");
  const resolvedNetworkIds = networkIds?.length ? networkIds : undefined;

  const isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );

  const resolvedCategories = categories?.length ? categories : undefined;

  const { data, isLoading, isSuccess, isError, error, refetch, loadNext } = useAssetsData({
    search: searchedValue,
    currencyIds: resolvedNetworkIds === undefined ? currencyIds : undefined,
    networkIds: resolvedNetworkIds,
    categories: resolvedCategories,
    product: "llm",
    version: VersionNumber.appVersion,
    useCase,
    areCurrenciesFiltered: resolvedNetworkIds === undefined ? areCurrenciesFiltered : false,
    isStaging,
    includeTestNetworks: devMode,
  });

  const assetsSorted = useMemo(
    () => (data ? buildAssetsSorted(data, { networkIds: resolvedNetworkIds }) : undefined),
    [data, resolvedNetworkIds],
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
