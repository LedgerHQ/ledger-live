import React, { useState } from "react";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { useInitModularDrawer } from "./hooks/useInitModularDrawer";
import { useAssets } from "./hooks/useAssets";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
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
  /** List of currencies to display in the drawer */
  readonly currencies: CryptoOrTokenCurrency[];
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
  const [itemsToDisplay, setItemsToDisplay] = useState<CryptoOrTokenCurrency[]>([]);

  const { sortedCryptoCurrencies, isReadyToBeDisplayed, currenciesByProvider } =
    useInitModularDrawer();

  const { availableAssets, currencyIdsArray } = useAssets(
    currencies,
    currenciesByProvider,
    sortedCryptoCurrencies,
  );

  const {
    setDefaultSearchValue,
    asset,
    handleAsset,
    handleNetwork,
    handleBackButton,
    handleCloseButton,
    hasOneCurrency,
    availableNetworks,
    defaultSearchValue,
    shouldShowBackButton,
    navigationStepManager,
    onAddNewAccount,
  } = useModularDrawerState({
    currenciesByProvider,
    currencyIds: currencyIdsArray,
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
          availableAssets,
          onAssetSelected: handleAsset,
          defaultSearchValue,
          setDefaultSearchValue,
          itemsToDisplay,
          setItemsToDisplay,
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
          asset,
          onAccountSelected,
          flow,
          source,
          onClose,
        }}
        isReadyToBeDisplayed={isReadyToBeDisplayed}
      />
    </QueuedDrawerGorhom>
  );
}
