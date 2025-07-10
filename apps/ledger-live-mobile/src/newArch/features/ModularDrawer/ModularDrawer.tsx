import React from "react";
import QueuedDrawer from "~/components/QueuedDrawer";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { ModularDrawerStep } from "./types";
import { useModularDrawerFlowStepManager } from "./hooks/useModularDrawerFlowStepManager";

import { useInitModularDrawer } from "./hooks/useInitModularDrawer";
import { useAssets } from "./hooks/useAssets";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerState } from "./hooks/useModularDrawerState";

/**
 * Props for the ModularDrawer component.
 */
type ModularDrawerProps = {
  /**
   * The current step to display in the drawer navigation flow.
   */
  selectedStep: ModularDrawerStep;
  /**
   * Whether the drawer is open.
   */
  isOpen?: boolean;
  /**
   * Callback fired when the drawer is closed.
   */
  onClose?: () => void;
  /**
   * List of currencies to display in the drawer.
   */
  currencies: CryptoOrTokenCurrency[];
};
/**
 * ModularDrawer is a generic drawer component for asset/network selection flows.
 * Handles navigation steps, asset/network selection, and drawer state.
 *
 * @param {ModularDrawerProps} props - The props for the ModularDrawer component.
 */
export function ModularDrawer({ isOpen, onClose, selectedStep, currencies }: ModularDrawerProps) {
  const navigationStepManager = useModularDrawerFlowStepManager({ selectedStep });

  const { sortedCryptoCurrencies, isReadyToBeDisplayed, currenciesByProvider } =
    useInitModularDrawer();

  const { availableAssets, currencyIdsArray } = useAssets(currencies, sortedCryptoCurrencies);

  const { handleAsset, handleNetwork, reset, handleBack, availableNetworks } =
    useModularDrawerState({
      goToStep: navigationStepManager.goToStep,
      currenciesByProvider,
      currencyIds: currencyIdsArray,
    });

  /**
   * Handlers for the back & close button in the drawer.
   */

  const handleBackButton = () => {
    handleBack(navigationStepManager.currentStep);
  };

  const handleCloseButton = () => {
    onClose?.();
    navigationStepManager.reset();
    reset();
  };

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={handleCloseButton}
      hasBackButton={navigationStepManager.hasBackButton}
      onBack={handleBackButton}
      containerStyle={{
        maxHeight: "90%",
      }}
    >
      {/* TODO: Drawer Transitions & animations will be implemented here. */}
      <ModularDrawerFlowManager
        navigationStepViewModel={navigationStepManager}
        assetsViewModel={{
          availableAssets,
          onAssetSelected: handleAsset,
        }}
        networksViewModel={{
          onNetworkSelected: handleNetwork,
          availableNetworks,
        }}
        isReadyToBeDisplayed={isReadyToBeDisplayed}
      />
    </QueuedDrawer>
  );
}
