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
import type { AssetsData } from "@domain/api-aggregated-assets";
import type { AggregatedAssetId } from "@domain/entity-aggregated-asset";
import { XRP_DEV_TOKENS } from "@ledgerhq/live-common/families/xrp/devTokens";

// TEMP prototype: DADA does not list the XRP dev tokens, so they are added to its response
function withXrpDevTokens(data: AssetsData, currencyIds?: string[]): AssetsData {
  const knownIds = new Set(Object.keys(data.cryptoOrTokenCurrencies));
  const tokens = XRP_DEV_TOKENS.filter(
    token => !knownIds.has(token.id) && (!currencyIds?.length || currencyIds.includes(token.id)),
  );
  if (tokens.length === 0) return data;

  const assetIds = tokens.map(token => token.id as AggregatedAssetId);

  return {
    ...data,
    cryptoAssets: {
      ...data.cryptoAssets,
      ...Object.fromEntries(
        tokens.map(token => [
          token.id,
          {
            id: token.id as AggregatedAssetId,
            ticker: token.ticker,
            name: token.name,
            assetsIds: { [token.parentCurrencyId]: token.id },
          },
        ]),
      ),
    },
    cryptoOrTokenCurrencies: {
      ...data.cryptoOrTokenCurrencies,
      ...Object.fromEntries(tokens.map(token => [token.id, token])),
    },
    currenciesOrder: {
      ...data.currenciesOrder,
      metaCurrencyIds: [...data.currenciesOrder.metaCurrencyIds, ...assetIds],
    },
  };
}

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
    data: apiData,
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
  const data = useMemo(
    () => (apiData ? withXrpDevTokens(apiData, currencyIds) : undefined),
    [apiData, currencyIds],
  );

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
