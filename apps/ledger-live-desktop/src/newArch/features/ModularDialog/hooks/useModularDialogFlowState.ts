import { useState, useCallback, useEffect } from "react";
import { getAssetByCurrency } from "../utils/getAssetByCurrency";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ModularDialogStep } from "../types";
import { useModularDialogAnalytics } from "../analytics/useModularDialogAnalytics";
import { MODULAR_DIALOG_PAGE_NAME } from "../analytics/modularDialog.types";
import uniqWith from "lodash/uniqWith";

import { belongsToSameNetwork } from "@ledgerhq/live-common/modularDrawer/utils/index";
import { useSelector } from "LLD/hooks/redux";
import {
  modularDialogCurrencies,
  modularDialogOnAccountSelected,
  modularDialogOnAssetSelected,
  modularDrawerSearchedSelector,
} from "~/renderer/reducers/modularDrawer";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";

type Props = {
  assets: AssetData[] | undefined;
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
  setNetworksToDisplay: (networks?: CryptoOrTokenCurrency[]) => void;
  goToStep: (nextStep: ModularDialogStep) => void;
};

export function useModularDialogFlowState({
  assets,
  sortedCryptoCurrencies,
  setNetworksToDisplay,
  goToStep,
}: Props) {
  const isAcceptedCurrency = useAcceptedCurrency();
  const { trackModularDialogEvent } = useModularDialogAnalytics();
  const searchedValue = useSelector(modularDrawerSearchedSelector);
  const currencyIds = useSelector(modularDialogCurrencies);
  const onAssetSelected = useSelector(modularDialogOnAssetSelected);
  const onAccountSelected = useSelector(modularDialogOnAccountSelected);

  const [selectedAsset, setSelectedAsset] = useState<CryptoOrTokenCurrency>();
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoOrTokenCurrency>();
  const [providers, setProviders] = useState<AssetData>();

  const goBackToAssetSelection = useCallback(() => {
    setSelectedAsset(undefined);
    setSelectedNetwork(undefined);
    setNetworksToDisplay(undefined);
    trackModularDialogEvent("button_clicked", {
      button: "Back",
      page: MODULAR_DIALOG_PAGE_NAME.MODULAR_NETWORK_SELECTION,
    });
    goToStep("ASSET_SELECTION");
  }, [goToStep, setNetworksToDisplay, trackModularDialogEvent]);

  const goBackToNetworkSelection = useCallback(() => {
    setSelectedNetwork(undefined);
    goToStep("NETWORK_SELECTION");
  }, [goToStep]);

  const goToNetworkSelection = useCallback(
    (asset: CryptoOrTokenCurrency, filteredCryptoCurrencies: CryptoOrTokenCurrency[]) => {
      setSelectedAsset(asset);
      setNetworksToDisplay(uniqWith(filteredCryptoCurrencies, (a, b) => a.id === b.id));
      goToStep("NETWORK_SELECTION");
    },
    [goToStep, setNetworksToDisplay],
  );

  const goToAccountSelection = useCallback(
    (asset: CryptoOrTokenCurrency, network: CryptoOrTokenCurrency) => {
      setSelectedAsset(asset);
      setSelectedNetwork(network);
      goToStep("ACCOUNT_SELECTION");
    },
    [goToStep],
  );

  const handleNetworkSelected = useCallback(
    (network: CryptoOrTokenCurrency) => {
      if (!providers) return;
      const correspondingCurrency =
        providers.networks.find(elem => belongsToSameNetwork(elem, network)) ?? network;

      if (onAccountSelected) {
        goToAccountSelection(correspondingCurrency, network);
      } else {
        onAssetSelected?.(correspondingCurrency);
      }
    },
    [goToAccountSelection, onAccountSelected, onAssetSelected, providers],
  );

  const getNetworksFromProvider = useCallback(
    (provider: AssetData) => {
      return provider.networks.filter(elem => {
        const isAllowedByFilter = currencyIds?.length === 0 || currencyIds?.includes(elem.id);

        return isAcceptedCurrency(elem) && isAllowedByFilter;
      });
    },
    [isAcceptedCurrency, currencyIds],
  );

  const handleNoProvider = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      if (onAccountSelected) {
        goToAccountSelection(currency, currency);
      } else {
        onAssetSelected?.(currency);
      }
    },
    [onAccountSelected, goToAccountSelection, onAssetSelected],
  );

  const handleMultipleNetworks = useCallback(
    (currency: CryptoOrTokenCurrency, networks: CryptoOrTokenCurrency[]) => {
      goToNetworkSelection(currency, networks);
    },
    [goToNetworkSelection],
  );

  const handleSingleNetwork = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      if (onAccountSelected) {
        goToAccountSelection(currency, currency);
      } else {
        onAssetSelected?.(currency);
      }
    },
    [onAccountSelected, goToAccountSelection, onAssetSelected],
  );

  const handleAssetSelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      const currentProvider = getAssetByCurrency(currency, assets);
      setProviders(currentProvider);

      if (!currentProvider) {
        handleNoProvider(currency);
        return;
      }

      const networks = getNetworksFromProvider(currentProvider);
      const hasMultipleNetworks = networks && networks.length > 1;
      if (hasMultipleNetworks) {
        handleMultipleNetworks(currency, networks);
      } else {
        handleSingleNetwork(currency);
      }
    },
    [
      assets,
      handleNoProvider,
      getNetworksFromProvider,
      handleMultipleNetworks,
      handleSingleNetwork,
    ],
  );

  useEffect(() => {
    if (assets?.length === 1 && searchedValue === undefined && !selectedAsset) {
      const assetItem = assets[0];

      if (assetItem.networks.length > 0) {
        const currency = assetItem.networks[0];

        handleAssetSelected(currency);
      }
    }
  }, [sortedCryptoCurrencies, goToStep, handleAssetSelected, selectedAsset, searchedValue, assets]);

  return {
    selectedAsset,
    setSelectedAsset,
    selectedNetwork,
    setSelectedNetwork,
    providers,
    setProviders,
    goBackToAssetSelection,
    goBackToNetworkSelection,
    goToNetworkSelection,
    goToAccountSelection,
    handleNetworkSelected,
    handleAssetSelected,
  };
}
