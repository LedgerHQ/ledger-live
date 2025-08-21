import { useMemo } from "react";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { useAssetsData } from "./useAssetsData";
import { getLoadingStatus } from "../utils/getLoadingStatus";
import { findCryptoCurrencyById, findTokenById } from "@ledgerhq/cryptoassets";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

interface UseModularDrawerDataProps {
  currencies?: CryptoOrTokenCurrency[];
  searchedValue?: string;
}

export function useModularDrawerData({ currencies, searchedValue }: UseModularDrawerDataProps) {
  const currencyIds = useMemo(() => (currencies || []).map(currency => currency.id), [currencies]);

  const { data, isLoading, isSuccess, error } = useAssetsData({
    search: searchedValue,
    currencyIds,
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
          interestRates: data.interestRates[firstNetworkId],
          market: data.markets[firstNetworkId],
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
    loadingStatus,
    assetsSorted,
    currenciesByProvider,
    sortedCryptoCurrencies,
  };
}
