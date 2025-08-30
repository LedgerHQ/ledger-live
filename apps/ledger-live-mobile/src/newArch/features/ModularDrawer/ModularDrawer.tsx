import React, { useEffect, useState } from "react";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { useAssetsFromDada } from "./hooks/useAssetsFromDada";
import { useModularDrawerState } from "./hooks/useModularDrawerState";

import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";

import { AccountLike } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";

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
  /** The flow identifier for analytics */
  readonly flow: string;
  /** The source identifier for analytics */
  readonly source: string;
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
  flow,
  source,
  assetsConfiguration,
  networksConfiguration,
  enableAccountSelection = false,
  onAccountSelected,
  accounts$,
}: ModularDrawerProps) {
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSearchValue("");
    }
  }, [isOpen]);

  const { sortedCryptoCurrencies, isSuccess, assetsSorted } = useAssetsFromDada({
    currencyIds: currencies,
    searchedValue: searchValue,
  });

  const {
    assetForAccount,
    handleAsset,
    handleNetwork,
    handleBackButton,
    handleCloseButton,
    availableNetworks,
    shouldShowBackButton,
    navigationStepManager,
    hasOneCurrency,
    onAddNewAccount,
  } = useModularDrawerState({
    assetsSorted,
    currencyIds: currencies ?? [],
    isDrawerOpen: isOpen,
    flow,
    enableAccountSelection,
    onClose,
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
          defaultSearchValue: searchValue,
          setDefaultSearchValue: setSearchValue,
          flow,
          source,
          assetsConfiguration,
          isOpen,
        }}
        networksViewModel={{
          onNetworkSelected: handleNetwork,
          availableNetworks,
          flow,
          source,
          networksConfiguration,
        }}
        accountsViewModel={{
          accounts$,
          onAddNewAccount,
          asset: assetForAccount,
          onAccountSelected,
          flow,
          source,
        }}
        isReadyToBeDisplayed={isSuccess}
      />
    </QueuedDrawerGorhom>
  );
}
