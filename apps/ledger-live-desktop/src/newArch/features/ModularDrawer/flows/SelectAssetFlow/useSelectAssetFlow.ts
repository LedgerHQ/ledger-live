import { useState, useCallback, useMemo, useEffect } from "react";
import { CryptoCurrency, CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import {
  CurrenciesByProviderId,
  LoadingBasedGroupedCurrencies,
  LoadingStatus,
} from "@ledgerhq/live-common/deposit/type";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { FlowStep, NavigationDirection } from "../../components/Header/navigation";

type UseSelectAssetFlowProps = {
  currencies: CryptoOrTokenCurrency[];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

export function useSelectAssetFlow({ onAssetSelected, currencies }: UseSelectAssetFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>(FlowStep.SELECT_ASSET_TYPE);
  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoCurrency[]>([]);
  const [searchedValue, setSearchedValue] = useState<string>();
  const [navDirection, setNavDirection] = useState<NavigationDirection>(
    NavigationDirection.FORWARD,
  );
  const [providers, setProviders] = useState<CurrenciesByProviderId>();

  const currenciesIdsArray = useMemo(() => currencies.map(currency => currency.id), [currencies]);

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const { currenciesByProvider, sortedCryptoCurrencies } = result;

  const filteredSortedCryptoCurrencies = useMemo(
    () => sortedCryptoCurrencies.filter(currency => currenciesIdsArray.includes(currency.id)),
    [sortedCryptoCurrencies, currenciesIdsArray],
  );

  const [assetsToDisplay, setAssetsToDisplay] = useState<CryptoOrTokenCurrency[]>(
    filteredSortedCryptoCurrencies,
  );

  useEffect(() => {
    setAssetsToDisplay(filteredSortedCryptoCurrencies);
  }, [filteredSortedCryptoCurrencies]);

  const assetTypes: AssetType[] = useMemo(
    () =>
      currenciesByProvider.map(provider => ({
        id: provider.providerId,
        name: provider.providerId,
        ticker: provider.providerId,
      })),
    [currenciesByProvider],
  );

  const getProvider = useCallback(
    (currency: CryptoCurrency | TokenCurrency) =>
      currency &&
      currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork =>
            (currencyByNetwork as CryptoCurrency | TokenCurrency).id === currency.id,
        ),
      ),
    [currenciesByProvider],
  );

  const handleAssetTypeSelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      const currentProvider = getProvider(currency);
      setProviders(currentProvider);

      if (!currentProvider) {
        onAssetSelected(currency);
        return;
      }

      const networks = currentProvider.currenciesByNetwork
        .filter(currencyByNetwork => currenciesIdsArray.includes(currencyByNetwork.id))
        .map(elem => (elem.type === "TokenCurrency" ? elem.parentCurrency?.id : elem.id));

      const hasMultipleNetworks = networks && networks.length > 1;

      if (hasMultipleNetworks) {
        setNavDirection(NavigationDirection.FORWARD);
        const filteredCryptoCurrencies = networks
          .map(net => findCryptoCurrencyById(net))
          .filter((cur): cur is CryptoCurrency => Boolean(cur));

        setNetworksToDisplay(filteredCryptoCurrencies);
        setCurrentStep(FlowStep.SELECT_NETWORK);
      } else {
        onAssetSelected(currency);
      }
    },
    [getProvider, onAssetSelected, currenciesIdsArray],
  );

  const handleNetworkSelected = useCallback(
    (network: CryptoOrTokenCurrency) => {
      if (!providers) return;

      const correspondingCurrency = providers.currenciesByNetwork.find(elem => {
        if (elem.type === "TokenCurrency") {
          return elem.id === network.id || elem.parentCurrency?.id === network.id;
        } else if (elem.type === "CryptoCurrency") {
          return elem.id === network.id;
        }
        return false;
      });

      if (correspondingCurrency) {
        onAssetSelected(correspondingCurrency);
      }
    },
    [onAssetSelected, providers],
  );

  useEffect(() => {
    if (currencies?.length === 1 && sortedCryptoCurrencies.length > 0) {
      const asset = sortedCryptoCurrencies.find(c => c.id === currencies[0].id);
      if (asset) {
        onAssetSelected(asset);
      }
    }
  }, [sortedCryptoCurrencies, onAssetSelected, currencies]);

  const handleBackClick = useCallback(() => {
    if (currentStep === FlowStep.SELECT_NETWORK) {
      setNavDirection(NavigationDirection.BACKWARD);
      setCurrentStep(FlowStep.SELECT_ASSET_TYPE);
      setNetworksToDisplay([]);
    }
  }, [currentStep]);

  useEffect(() => {
    if (assetsToDisplay.length === 1) {
      const asset = assetsToDisplay[0];
      if (asset) {
        handleAssetTypeSelected(asset);
      }
    }
  }, [assetsToDisplay, handleAssetTypeSelected, onAssetSelected]);

  const isLoading =
    providersLoadingStatus === LoadingStatus.Pending ||
    (currencies?.length === 1 && sortedCryptoCurrencies.length > 0);

  return {
    currentStep,
    navDirection,
    networksToDisplay,
    assetsToDisplay,
    assetTypes,
    sortedCryptoCurrencies: filteredSortedCryptoCurrencies,
    defaultSearchValue: searchedValue,
    isLoading,
    isAssetSelection: currentStep === FlowStep.SELECT_ASSET_TYPE,
    setAssetsToDisplay,
    handleAssetTypeSelected,
    handleNetworkSelected,
    handleBackClick,
    setSearchedValue,
  };
}
