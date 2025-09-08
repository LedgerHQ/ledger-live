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
import { modularDrawerSearchValueSelector } from "~/reducers/modularDrawer";

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
  /** Enables account selection in the drawer */
  readonly enableAccountSelection?: boolean;
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
  enableAccountSelection = false,
  onAccountSelected,
  accounts$,
  useCase,
  areCurrenciesFiltered,
}: ModularDrawerProps) {
  const searchValue = useSelector(modularDrawerSearchValueSelector);
  const { sortedCryptoCurrencies, assetsSorted, isLoading, error, refetch, loadNext } = useAssets({
    currencyIds: currencies,
    searchedValue: searchValue,
    useCase,
    areCurrenciesFiltered,
  });

  const {
    accountCurrency,
    handleAsset,
    handleNetwork,
    handleBackButton,
    handleCloseButton,
    availableNetworks,
    shouldShowBackButton,
    navigationStepManager,
    hasOneCurrency,
    onAddNewAccount,
    asset,
  } = useModularDrawerState({
    assetsSorted,
    currencyIds: currencies ?? [],
    isDrawerOpen: isOpen,
    enableAccountSelection,
    onClose,
    hasSearchedValue: searchValue.length > 0,
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
        navigationStepViewModel={navigationStepManager}
        assetsViewModel={{
          availableAssets: sortedCryptoCurrencies,
          onAssetSelected: handleAsset,
          assetsConfiguration,
          isOpen,
          isLoading,
          hasError: !!error,
          refetch,
          loadNext,
        }}
        networksViewModel={{
          onNetworkSelected: handleNetwork,
          availableNetworks,
          networksConfiguration,
          asset,
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
