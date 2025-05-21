import { useState, useCallback, useMemo, useEffect } from "react";
import { CryptoCurrency, CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { LoadingBasedGroupedCurrencies, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { FlowStep, NavigationDirection } from "../Header/navigation";

type UseSelectAssetFlowProps = {
  currencies: CryptoOrTokenCurrency[];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

export function useSelectAssetFlow({ onAssetSelected, currencies }: UseSelectAssetFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>(FlowStep.SELECT_ASSET_TYPE);
  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>([]);
  const [searchedValue, setSearchedValue] = useState<string | undefined>(undefined);
  const [navDirection, setNavDirection] = useState<NavigationDirection>(
    NavigationDirection.FORWARD,
  );

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const { currenciesByProvider, sortedCryptoCurrencies } = result;
  const [assetsToDisplay, setAssetsToDisplay] =
    useState<CryptoOrTokenCurrency[]>(sortedCryptoCurrencies);

  useEffect(() => {
    setAssetsToDisplay(sortedCryptoCurrencies);
  }, [sortedCryptoCurrencies]);

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
      const provider = getProvider(currency);

      if (!provider) {
        onAssetSelected(currency);
        return;
      }

      const networks = provider.currenciesByNetwork.map(elem =>
        elem.type === "TokenCurrency" ? elem?.parentCurrency?.id : elem.id,
      );

      const hasMultipleNetworks = networks && networks.length > 1;

      if (hasMultipleNetworks) {
        setNavDirection(NavigationDirection.FORWARD);
        const filteredCryptoCurrencies = networks
          .map(net => findCryptoCurrencyById(net))
          .filter(Boolean) as CryptoCurrency[];

        setNetworksToDisplay(filteredCryptoCurrencies);
        setCurrentStep(FlowStep.SELECT_NETWORK);
      } else {
        onAssetSelected(currency);
      }
    },
    [getProvider, onAssetSelected],
  );

  const handleNetworkSelected = useCallback(
    (network: CryptoOrTokenCurrency) => onAssetSelected(network),
    [onAssetSelected],
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

  const isLoading =
    providersLoadingStatus === LoadingStatus.Pending ||
    (currencies?.length === 1 && sortedCryptoCurrencies.length > 0);

  return {
    currentStep,
    navDirection,
    networksToDisplay,
    assetsToDisplay,
    assetTypes,
    sortedCryptoCurrencies,
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
