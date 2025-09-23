import { useMemo, useState, useEffect } from "react";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { getLoadingStatus } from "@ledgerhq/live-common/modularDrawer/utils/getLoadingStatus";
import { findCryptoCurrencyById, findTokenById } from "@ledgerhq/cryptoassets";
import { useAssetsData } from "@ledgerhq/live-common/modularDrawer/hooks/useAssetsData";
import { modularDrawerSearchedSelector } from "~/renderer/reducers/modularDrawer";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

interface UseModularDrawerDataProps {
  currencyIds?: string[];
  useCase?: string;
  areCurrenciesFiltered?: boolean;
}

export function useModularDrawerData({
  currencyIds,
  useCase,
  areCurrenciesFiltered,
}: UseModularDrawerDataProps) {
  const modularDrawerFeature = useFeature("lldModularDrawer");

  const _isStaging = useMemo(
    () => modularDrawerFeature?.params?.backendEnvironment === "STAGING",
    [modularDrawerFeature?.params?.backendEnvironment],
  );
  const searchedValue = useSelector(modularDrawerSearchedSelector);

  const { data, isLoading, isSuccess, error, loadNext, refetch } = useAssetsData({
    search: searchedValue,
    currencyIds,
    product: "lld",
    version: __APP_VERSION__,
    useCase,
    areCurrenciesFiltered,
    isStaging: _isStaging,
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

  const [currenciesByProvider, setCurrenciesByProvider] = useState<CurrenciesByProviderId[]>([]);

  useEffect(() => {
    if (!assetsSorted || !data) {
      setCurrenciesByProvider([]);
      return;
    }

    async function loadCurrenciesByProvider() {
      try {
        const results = await Promise.all(
          assetsSorted!.map(async assetData => {
            const currencies = await Promise.all(
              assetData.networks.map(async network => {
                const cryptoCurrency = findCryptoCurrencyById(network.id);
                if (cryptoCurrency) return cryptoCurrency;

                try {
                  const tokenCurrency = await findTokenById(network.id);
                  return tokenCurrency;
                } catch (error) {
                  console.warn("Failed to find token:", network.id, error);
                  return null;
                }
              }),
            );

            return {
              currenciesByNetwork: currencies.filter(
                (currency): currency is NonNullable<typeof currency> =>
                  currency !== null && currency !== undefined,
              ),
              providerId: assetData.asset.id,
              metaCurrencyId: assetData.asset.metaCurrencyId,
            };
          }),
        );
        setCurrenciesByProvider(results);
      } catch (error) {
        console.error("Failed to load currencies by provider:", error);
        setCurrenciesByProvider([]);
      }
    }

    loadCurrenciesByProvider();
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
