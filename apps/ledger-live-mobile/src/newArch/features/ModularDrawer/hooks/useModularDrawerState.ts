import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import uniqWith from "lodash/uniqWith";
import { useCallback, useState } from "react";

/**
 * Props for useModularDrawerState hook.
 */
type UseModularDrawerStateProps = {
  /**
   * Function to go to the next step in the drawer flow.
   */
  nextStep?: () => void;
  /**
   * Function to go to the previous step in the drawer flow.
   */
  prevStep?: () => void;
  /**
   * List of filtered and sorted crypto currencies.
   */
  filteredSortedCryptoCurrencies: CryptoOrTokenCurrency[];
};

/**
 * Manages the state and navigation logic for the modular drawer (asset/network selection).
 * @param {UseModularDrawerStateProps} props - The state manager props.
 *
 */
export function useModularDrawerState({
  nextStep,
  prevStep,
  filteredSortedCryptoCurrencies,
}: UseModularDrawerStateProps) {
  const [selectedAsset, setSelectedAsset] = useState<CryptoOrTokenCurrency | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<CryptoOrTokenCurrency | null>(null);

  const [networksToDisplay, setNetworksToDisplay] = useState<CryptoOrTokenCurrency[]>([]);

  function onNetworkSelected(network: CryptoOrTokenCurrency) {
    setSelectedNetwork(network);
    nextStep?.();
  }

  const onAssetSelected = useCallback(
    (asset: CryptoOrTokenCurrency) => {
      setSelectedAsset(asset);
      setNetworksToDisplay(uniqWith(filteredSortedCryptoCurrencies, (a, b) => a.id === b.id));
      nextStep?.();
    },
    [filteredSortedCryptoCurrencies, nextStep],
  );

  const resetState = useCallback(() => {
    setSelectedAsset(null);
    setSelectedNetwork(null);
    setNetworksToDisplay([]);
  }, []);

  const goBackToAssetSelection = useCallback(() => {
    resetState();
    prevStep?.();
  }, [prevStep, resetState]);

  const goBackToNetworkSelection = useCallback(() => {
    setSelectedNetwork(null);
    prevStep?.();
  }, [prevStep]);

  return {
    onAssetSelected,
    onNetworkSelected,
    selectedAsset,
    selectedNetwork,
    networksToDisplay,
    goBackToNetworkSelection,
    goBackToAssetSelection,
    resetState,
  };
}
