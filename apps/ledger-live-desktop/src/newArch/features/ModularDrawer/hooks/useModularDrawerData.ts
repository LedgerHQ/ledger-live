import { useMemo } from "react";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { modularDrawerSearchedSelector } from "~/renderer/reducers/modularDrawer";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";

type Context = "MAD" | "MARKET";

interface UseModularDrawerDataProps {
  currencyIds?: string[];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  searchedValueMarket?: string;
  context?: Context;
  pageSize?: number;
  pollingInterval?: number;
}

export function useModularDrawerData({
  currencyIds,
  useCase,
  areCurrenciesFiltered,
  searchedValueMarket,
  context = "MAD",
  pageSize,
  pollingInterval,
}: UseModularDrawerDataProps) {
  const modularDrawerFeature = useFeature("lldModularDrawer");

  const isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );
  const searchedValue = useSelector(modularDrawerSearchedSelector);

  const { data, isLoading, isSuccess, error, loadNext, refetch } = useAssetsData({
    search: searchedValueMarket || searchedValue,
    currencyIds,
    product: "lld",
    version: __APP_VERSION__,
    useCase,
    areCurrenciesFiltered,
    isStaging,
    ...(pageSize !== undefined && { pageSize }),
    ...(pollingInterval !== undefined && { pollingInterval }),
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

  // Calcul conditionnel selon le contexte
  const sortedCryptoCurrencies = useMemo(() => {
    if (context !== "MAD" || !assetsSorted || !data) return [];

    return assetsSorted
      .map(assetData => data.cryptoOrTokenCurrencies[assetData.asset.id])
      .filter(currency => currency !== undefined);
  }, [assetsSorted, data, context]);

  const sortedCryptoCurrenciesMarket = useMemo(() => {
    if (context !== "MARKET" || !assetsSorted || !data) return [];

    return assetsSorted
      .map(assetData => ({
        currency: data.cryptoOrTokenCurrencies[assetData.asset.id],
        market: data.markets[assetData.asset.id],
        asset: assetData.asset,
      }))
      .filter(el => el.currency !== undefined);
  }, [assetsSorted, data, context]);

  return {
    data,
    isLoading,
    error,
    refetch,
    loadingStatus,
    assetsSorted,
    sortedCryptoCurrencies,
    loadNext,
    sortedCryptoCurrenciesMarket,
  };
}
