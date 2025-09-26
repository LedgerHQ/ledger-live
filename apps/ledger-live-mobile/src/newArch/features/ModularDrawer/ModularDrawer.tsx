import React from "react";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { useAssets } from "./hooks/useAssets";
import { useModularDrawerState } from "./hooks/useModularDrawerState";

import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";

import { AccountLike } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";
import { useSelector } from "react-redux";
import {
  modularDrawerEnableAccountSelectionSelector,
  modularDrawerSearchValueSelector,
} from "~/reducers/modularDrawer";

import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";

const SNAP_POINTS = ["70%", "92%"];

/**
 * Props for the ModularDrawer component.
 */
type ModularDrawerProps = {
  // Core drawer state
  /** Whether the drawer is open */
  readonly isOpen: boolean;
  /** Callback fired when the drawer is closed */
  readonly onClose?: () => void;

  // Data and configuration
  /** List of preselected currencies to display in the drawer */
  readonly currencies?: string[];
  /** Configuration for assets display */
  readonly assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  /** Configuration for networks display */
  readonly networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];

  // Account selection
  /** Callback fired when an account is selected */
  readonly onAccountSelected?: (account: AccountLike, parentAccount?: AccountLike) => void;
  /** Observable of accounts */
  readonly accounts$?: Observable<WalletAPIAccount[]>;

  /** The use case identifier for the drawer */
  readonly useCase?: string;
  /** Whether the currencies are filtered */
  readonly areCurrenciesFiltered?: boolean;
};

/**
 * ModularDrawer is a generic drawer component for asset/network selection flows.
 * Handles navigation steps, asset/network selection, and drawer state.
 *
 * @param {ModularDrawerProps} props - The props for the ModularDrawer component.
 */
export function ModularDrawer({
  isOpen,
  onClose,
  currencies,
  assetsConfiguration,
  networksConfiguration,
  onAccountSelected,
  accounts$,
  useCase,
  areCurrenciesFiltered,
}: ModularDrawerProps) {
  const {
    assetsConfiguration: assetsConfigurationSanitized,
    networkConfiguration: networkConfigurationSanitized,
  } = useModularDrawerConfiguration("llmModularDrawer", {
    assets: assetsConfiguration,
    networks: networksConfiguration,
  });

  const searchValue = useSelector(modularDrawerSearchValueSelector);
  const enableAccountSelection = useSelector(modularDrawerEnableAccountSelectionSelector);
  const { sortedCryptoCurrencies, assetsSorted, isLoading, isError, refetch, loadNext } = useAssets(
    {
      currencyIds: currencies,
      searchedValue: searchValue,
      useCase,
      areCurrenciesFiltered,
    },
  );

  const {
    accountCurrency,
    handleAsset,
    handleNetwork,
    handleBackButton,
    handleCloseButton,
    availableNetworks,
    shouldShowBackButton,
    hasOneCurrency,
    onAddNewAccount,
  } = useModularDrawerState({
    assetsSorted,
    currencyIds: currencies ?? [],
    isDrawerOpen: isOpen,
    onClose,
    hasSearchedValue: searchValue.length > 0,
    onAccountSelected,
  });

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={(!hasOneCurrency || enableAccountSelection) && isOpen}
      onClose={handleCloseButton}
      enableBlurKeyboardOnGesture={true}
      snapPoints={SNAP_POINTS}
      hasBackButton={shouldShowBackButton}
      onBack={handleBackButton}
      enablePanDownToClose
      keyboardBehavior="extend"
    >
      <ModularDrawerFlowManager
        assetsViewModel={{
          availableAssets: sortedCryptoCurrencies,
          onAssetSelected: handleAsset,
          assetsConfiguration: assetsConfigurationSanitized,
          isOpen,
          isLoading,
          hasError: isError,
          refetch,
          loadNext,
          assetsSorted,
        }}
        networksViewModel={{
          onNetworkSelected: handleNetwork,
          availableNetworks,
          networksConfiguration: networkConfigurationSanitized,
        }}
        accountsViewModel={{
          accounts$,
          onAddNewAccount,
          asset: accountCurrency,
          onAccountSelected,
        }}
      />
    </QueuedDrawerGorhom>
  );
}
