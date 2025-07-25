import React, { useState } from "react";
import QueuedDrawer from "~/components/QueuedDrawer";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

import { useInitModularDrawer } from "./hooks/useInitModularDrawer";
import { useAssets } from "./hooks/useAssets";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerState } from "./hooks/useModularDrawerState";

import { AccountLike } from "@ledgerhq/types-live";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Observable } from "rxjs";

/**
 * Props for the ModularDrawer component.
 */
type ModularDrawerProps = {
  /**
   * Whether the drawer is open.
   */
  readonly isOpen: boolean;
  /**
   * Callback fired when the drawer is closed.
   */
  readonly onClose?: () => void;
  /**
   * List of currencies to display in the drawer.
   */
  readonly currencies: CryptoOrTokenCurrency[];
  /**
   * The flow identifier for analytics.
   */
  readonly flow: string;
  /**
   * The source identifier for analytics.
   */
  readonly source: string;
  /**
   * Configuration for assets display.
   */
  readonly assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  /**
   * Configuration for networks display.
   */
  readonly networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];

  /**
   *  Enables account selection in the drawer.
   */
  readonly enableAccountSelection?: boolean;
  /**
   * Callback fired when an account is selected.
   */
  readonly onAccountSelected?: (account: AccountLike, parentAccount?: AccountLike) => void;

  /**
   * Observable of Accounts
   */
  accounts$?: Observable<WalletAPIAccount[]>;
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
  const [defaultSearchValue, setDefaultSearchValue] = useState("");
  const [itemsToDisplay, setItemsToDisplay] = useState<CryptoOrTokenCurrency[]>([]);

  const { sortedCryptoCurrencies, isReadyToBeDisplayed, currenciesByProvider } =
    useInitModularDrawer();

  const { availableAssets, currencyIdsArray } = useAssets(currencies, sortedCryptoCurrencies);

  const {
    handleAsset,
    handleNetwork,
    handleBackButton,
    handleCloseButton,
    shouldShowBackButton,
    availableNetworks,
    asset,
    hasOneCurrency,
    navigationStepManager,
  } = useModularDrawerState({
    currencyIds: currencyIdsArray,
    currenciesByProvider,
    isDrawerOpen: isOpen,
    enableAccountSelection,
    onClose,
    onAccountSelected,
    flow,
  });

  return (
    <QueuedDrawer
      // Open drawer if enabled for account selection OR if multiple currencies available
      isRequestingToBeOpened={isOpen && (enableAccountSelection || !hasOneCurrency)}
      onClose={handleCloseButton}
      hasBackButton={shouldShowBackButton}
      onBack={handleBackButton}
      containerStyle={{
        maxHeight: "90%",
      }}
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
          asset,
          onAccountSelected,
        }}
        isReadyToBeDisplayed={isReadyToBeDisplayed}
      />
    </QueuedDrawer>
  );
}
