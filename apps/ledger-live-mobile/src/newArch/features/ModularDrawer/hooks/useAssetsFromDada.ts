import { useMemo } from "react";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useAssetsData } from "@ledgerhq/live-common/modularDrawer/hooks/useAssetsData";
import { MarketItemResponse } from "@ledgerhq/live-common/market/utils/types";
import { InterestRate } from "@ledgerhq/live-common/modularDrawer/data/entities/index";

interface UseAssetsProps {
  currencyIds?: string[];
  searchedValue?: string;
}

export type UseAssetsData =
  | {
      asset: {
        id: string;
        ticker: string;
        name: string;
        assetsIds: Record<string, string>;
      };
      networks: CryptoOrTokenCurrency[];
      interestRates?: InterestRate;
      market?: Partial<MarketItemResponse>;
    }[]
  | undefined;

export function useAssetsFromDada({ currencyIds, searchedValue }: UseAssetsProps) {
  const { data, isLoading, isSuccess, error, refetch, loadNext } = useAssetsData({
    search: searchedValue,
    currencyIds,
  });

  const assetsSorted: UseAssetsData = useMemo(() => {
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
    sortedCryptoCurrencies,
    refetch,
    loadNext,
  };
}
