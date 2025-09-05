import { useMemo } from "react";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { findCryptoCurrencyById, findTokenById } from "@ledgerhq/cryptoassets";
import { useAssetsData } from "@ledgerhq/live-common/modularDrawer/hooks/useAssetsData";

interface UseModularDrawerDataProps {
  currencyIds?: string[];
  searchedValue?: string;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
}

export function useModularDrawerData({
  currencyIds,
  searchedValue,
  useCase,
  areCurrenciesFiltered,
}: UseModularDrawerDataProps) {
  const { data, isLoading, isSuccess, error, loadNext, refetch } = useAssetsData({
    search: searchedValue,
    currencyIds,
    product: "lld",
    version: __APP_VERSION__,
    useCase,
    areCurrenciesFiltered,
  });

  const assetsSorted = useMemo(() => {
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

  const currenciesByProvider: CurrenciesByProviderId[] = useMemo(() => {
    if (!assetsSorted || !data) return [];

    return assetsSorted.map(assetData => ({
      currenciesByNetwork: assetData.networks
        .map(network => findCryptoCurrencyById(network.id) ?? findTokenById(network.id))
        .filter((currency): currency is NonNullable<typeof currency> => currency !== undefined),
      providerId: assetData.asset.id,
    }));
  }, [assetsSorted, data]);

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
    error,
    refetch,
    loadingStatus,
    assetsSorted,
    currenciesByProvider,
    sortedCryptoCurrencies,
    loadNext,
  };
}
