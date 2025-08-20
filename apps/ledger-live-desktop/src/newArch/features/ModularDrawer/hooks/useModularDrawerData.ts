import { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { useAssetsData } from "./useAssetsData";
import { getLoadingStatus } from "../utils/getLoadingStatus";
import { ModularDrawerFlowManagerProps } from "../types";

interface UseModularDrawerDataProps {
  currencies: ModularDrawerFlowManagerProps["currencies"];
  searchedValue?: string;
}

export function useModularDrawerData({ currencies, searchedValue }: UseModularDrawerDataProps) {
  const currencyIds = useMemo(() => currencies.map(currency => currency.id), [currencies]);

  const { data, isLoading, isSuccess, error } = useAssetsData({
    search: searchedValue,
    currencyIds,
  });

  const assetsSorted = useMemo(() => {
    if (!data?.currenciesOrder.metaCurrencyIds) return undefined;

    return data.currenciesOrder.metaCurrencyIds
      .filter(currencyId => data.cryptoAssets[currencyId])
      .map(currencyId => ({
        asset: data.cryptoAssets[currencyId],
        networks: Object.keys(data.cryptoAssets[currencyId].assetsIds).map(
          assetId => data.networks[assetId],
        ),
        interestRates: data.interestRates[currencyId],
        market: data.markets[currencyId],
      }));
  }, [data]);

  const loadingStatus: LoadingStatus = getLoadingStatus({ isLoading, isSuccess, error });

  const currenciesByProvider: CurrenciesByProviderId[] = useMemo(() => {
    if (!assetsSorted || !data) return [];

    return assetsSorted.map(assetData => ({
      currenciesByNetwork: assetData.networks
        .map(network => data.cryptoOrTokenCurrencies[network.id])
        .filter((currency): currency is CryptoOrTokenCurrency => currency !== undefined),
      providerId: assetData.asset.id,
    }));
  }, [assetsSorted, data]);

  const sortedCryptoCurrencies = useMemo(() => {
    if (!assetsSorted || !data) return [];

    return assetsSorted
      .map(assetData => data.cryptoOrTokenCurrencies[assetData.asset.id])
      .filter((currency): currency is CryptoOrTokenCurrency => currency !== undefined);
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
