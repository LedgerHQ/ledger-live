import { useMemo, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { useAssetSelection } from "./useAssetSelection";
import { haveOneCommonProvider } from "@ledgerhq/live-common/modularDrawer/utils/index";
import {
  buildProviderCoverageMap,
  filterProvidersByIds,
} from "@ledgerhq/live-common/modularDrawer/utils/currencyUtils";
import { addTestnetCurrencies } from "LLD/utils/testnetCurrencies";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { ModularDrawerFlowManagerProps } from "../types";

interface UseModularDrawerFilteringProps {
  currencies: ModularDrawerFlowManagerProps["currencies"];
  currenciesByProvider: CurrenciesByProviderId[];
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
  isSuccess: boolean;
}

export function useModularDrawerFiltering({
  currencies,
  currenciesByProvider,
  sortedCryptoCurrencies,
  isSuccess,
}: UseModularDrawerFilteringProps) {
  const devMode = useEnv("MANAGER_DEV_MODE");

  const {
    assetsToDisplay,
    filteredSortedCryptoCurrencies,
    currenciesIdsArray,
    currencyIdsSet,
    setAssetsToDisplay,
  } = useAssetSelection(currencies, sortedCryptoCurrencies);

  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>();
  const [originalAssetsToDisplay, setOriginalAssetsToDisplay] = useState<CryptoOrTokenCurrency[]>(
    [],
  );

  const hasOneNetwork = networksToDisplay?.length === 1;
  const hasOneCurrency = useMemo(() => {
    if (!isSuccess) return false;
    return haveOneCommonProvider(currenciesIdsArray, currenciesByProvider);
  }, [currenciesIdsArray, currenciesByProvider, isSuccess]);

  const filteredCurrenciesByProvider = useMemo(() => {
    if (currencyIdsSet.size === 0) {
      return currenciesByProvider;
    }

    const providerCoverageMap = buildProviderCoverageMap(currenciesByProvider);
    const filtered = filterProvidersByIds(
      currenciesByProvider,
      currencyIdsSet,
      providerCoverageMap,
    );
    const allProviderCurrencies = filtered
      .map(provider => provider.currenciesByNetwork[0])
      .filter(currency => currency !== null);
    const currenciesEnhanced = devMode
      ? addTestnetCurrencies(allProviderCurrencies)
      : allProviderCurrencies;

    setAssetsToDisplay(currenciesEnhanced);
    setOriginalAssetsToDisplay(currenciesEnhanced);

    return filtered;
  }, [currenciesByProvider, currencyIdsSet, setAssetsToDisplay, devMode]);

  return {
    assetsToDisplay,
    filteredSortedCryptoCurrencies,
    currenciesIdsArray,
    currencyIdsSet,
    setAssetsToDisplay,
    networksToDisplay,
    setNetworksToDisplay,
    originalAssetsToDisplay,
    hasOneNetwork,
    hasOneCurrency,
    filteredCurrenciesByProvider,
  };
}
