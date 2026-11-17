import { useMemo } from "react";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { useAssetsData } from "@features/platform-aggregated-assets";
import {
  modularDialogAreCurrenciesFilteredSelector,
  modularDialogCurrenciesSelector,
  modularDialogCategoriesSelector,
  modularDialogNetworkIdsSelector,
  modularDialogUseCaseSelector,
  modularDialogSearchedSelector,
} from "~/renderer/reducers/modularDialog";
import { useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import { buildAssetsSorted } from "@ledgerhq/live-common/modularDrawer/utils/buildAssetsSorted";
import useEnv from "@features/platform-env";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

export function useModularDialogData() {
  const modularDrawerFeature = useFeature("lldModularDrawer");
  const devMode = useEnv("MANAGER_DEV_MODE");

  const isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );
  const searchedValue = useSelector(modularDialogSearchedSelector);

  const currencyIds = useSelector(modularDialogCurrenciesSelector);
  const categories = useSelector(modularDialogCategoriesSelector);
  const resolvedCategories = useMemo(
    () => (categories?.length ? [...categories] : undefined),
    [categories],
  );
  const networkIds = useSelector(modularDialogNetworkIdsSelector);
  const resolvedNetworkIds = useMemo(
    () => (networkIds?.length ? networkIds : undefined),
    [networkIds],
  );
  const useCase = useSelector(modularDialogUseCaseSelector);
  const areCurrenciesFiltered = useSelector(modularDialogAreCurrenciesFilteredSelector);

  const {
    data: rawData,
    isLoading,
    isSuccess,
    error,
    errorInfo,
    loadNext,
    refetch,
  } = useAssetsData({
    search: searchedValue,
    currencyIds: resolvedNetworkIds === undefined ? currencyIds : undefined,
    networkIds: resolvedNetworkIds,
    categories: resolvedCategories,
    product: "lld",
    version: __APP_VERSION__,
    useCase,
    areCurrenciesFiltered: resolvedNetworkIds === undefined ? areCurrenciesFiltered : false,
    isStaging,
    includeTestNetworks: devMode,
  });

  // TEMP local bypass: DADA does not list ripple_testnet, so add it next to ripple in dev mode.
  const data = useMemo(() => {
    if (!devMode || !rawData?.cryptoAssets.ripple || rawData.cryptoAssets.ripple_testnet) {
      return rawData;
    }
    const id = "ripple_testnet";
    const name = "XRP (Testnet)";
    const ids = rawData.currenciesOrder.metaCurrencyIds;
    const at = ids.indexOf("ripple") + 1;
    return {
      ...rawData,
      cryptoAssets: {
        ...rawData.cryptoAssets,
        [id]: { id, ticker: "XRP", name, assetsIds: { [id]: id } },
      },
      networks: { ...rawData.networks, [id]: { id, name } },
      cryptoOrTokenCurrencies: {
        ...rawData.cryptoOrTokenCurrencies,
        [id]: getCryptoCurrencyById(id),
      },
      currenciesOrder: {
        ...rawData.currenciesOrder,
        metaCurrencyIds: [...ids.slice(0, at), id, ...ids.slice(at)],
      },
    };
  }, [devMode, rawData]);

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
