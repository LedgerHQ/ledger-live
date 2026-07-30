import { useMemo } from "react";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import {
  modularDialogAreCurrenciesFilteredSelector,
  modularDialogCurrenciesSelector,
  modularDialogNetworkIdsSelector,
  modularDialogUseCaseSelector,
  modularDialogSearchedSelector,
} from "~/renderer/reducers/modularDialog";
import { useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import { buildAssetsSorted } from "@ledgerhq/live-common/modularDrawer/utils/buildAssetsSorted";
import useEnv from "@features/platform-env";

export function useModularDialogData() {
  const modularDrawerFeature = useFeature("lldModularDrawer");
  const devMode = useEnv("MANAGER_DEV_MODE");

  const isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );
  const searchedValue = useSelector(modularDialogSearchedSelector);

  const currencyIds = useSelector(modularDialogCurrenciesSelector);
  const networkIds = useSelector(modularDialogNetworkIdsSelector);
  const resolvedNetworkIds = networkIds?.length ? networkIds : undefined;
  const useCase = useSelector(modularDialogUseCaseSelector);
  const areCurrenciesFiltered = useSelector(modularDialogAreCurrenciesFilteredSelector);

  const { data, isLoading, isSuccess, error, errorInfo, loadNext, refetch } = useAssetsData({
    search: searchedValue,
    currencyIds: resolvedNetworkIds === undefined ? currencyIds : undefined,
    networkIds: resolvedNetworkIds,
    product: "lld",
    version: __APP_VERSION__,
    useCase,
    areCurrenciesFiltered: resolvedNetworkIds === undefined ? areCurrenciesFiltered : false,
    isStaging,
    includeTestNetworks: devMode,
  });

  const assetsSorted = useMemo(
    () =>
      data
        ? buildAssetsSorted(data, {
            includeMetaCurrencyId: true,
            networkIds: resolvedNetworkIds,
          })
        : undefined,
    [data, resolvedNetworkIds],
  );

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
    errorInfo,
    refetch,
    loadingStatus,
    assetsSorted,
    sortedCryptoCurrencies,
    loadNext,
  };
}
