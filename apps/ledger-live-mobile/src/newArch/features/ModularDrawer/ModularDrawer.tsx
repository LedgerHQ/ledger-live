import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import QueuedDrawer from "~/components/QueuedDrawer";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { ModularDrawerStep } from "./types";
import { useModularDrawerFlowStepManager } from "./hooks/useModularDrawerFlowStepManager";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

import { useInitModularDrawer } from "./hooks/useInitModularDrawer";
import { useAssets } from "./hooks/useAssets";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerState } from "./hooks/useModularDrawerState";
import { haveOneCommonProvider } from "@ledgerhq/live-common/modularDrawer/utils/index";
import { useModularDrawerAnalytics, EVENTS_NAME, MODULAR_DRAWER_PAGE_NAME } from "./analytics";

/**
 * Props for the ModularDrawer component.
 */
type ModularDrawerProps = {
  /**
   * The current step to display in the drawer navigation flow.
   */
  readonly selectedStep?: ModularDrawerStep;
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
  selectedStep = ModularDrawerStep.Asset,
  flow,
  source,
  assetsConfiguration,
  networksConfiguration,
}: ModularDrawerProps) {
  const navigationStepManager = useModularDrawerFlowStepManager({ selectedStep });
  const [defaultSearchValue, setDefaultSearchValue] = useState("");
  const [itemsToDisplay, setItemsToDisplay] = useState<CryptoOrTokenCurrency[]>([]);
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const { sortedCryptoCurrencies, isReadyToBeDisplayed, currenciesByProvider } =
    useInitModularDrawer();

  const { availableAssets, currencyIdsArray } = useAssets(currencies, sortedCryptoCurrencies);

  const { handleAsset, handleNetwork, reset, handleBack, availableNetworks } =
    useModularDrawerState({
      goToStep: navigationStepManager.goToStep,
      currenciesByProvider,
      currencyIds: currencyIdsArray,
      isDrawerOpen: isOpen,
    });

  /**
   * Get the current page name for analytics based on the current step
   */
  const PAGE_NAME_MAP = useMemo(
    () => ({
      [ModularDrawerStep.Asset]: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
      [ModularDrawerStep.Network]: MODULAR_DRAWER_PAGE_NAME.MODULAR_NETWORK_SELECTION,
      [ModularDrawerStep.Account]: MODULAR_DRAWER_PAGE_NAME.MODULAR_ACCOUNT_SELECTION,
    }),
    [],
  );

  const getCurrentPageName = useCallback(() => {
    return (
      PAGE_NAME_MAP[navigationStepManager.currentStep] ??
      MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION
    );
  }, [PAGE_NAME_MAP, navigationStepManager.currentStep]);

  /**
   * Handlers for the back & close button in the drawer.
   */

  const handleBackButton = () => {
    trackModularDrawerEvent(EVENTS_NAME.BUTTON_CLICKED, {
      button: "modularDrawer_backButton",
      flow,
      page: getCurrentPageName(),
    });

    handleBack(navigationStepManager.currentStep);
  };

  const hasClosedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      hasClosedRef.current = false;
    }
  }, [isOpen]);

  const handleDrawerClose = () => {
    if (hasClosedRef.current) return;
    hasClosedRef.current = true;

    trackModularDrawerEvent(EVENTS_NAME.BUTTON_CLICKED, {
      button: "Close",
      flow,
      page: getCurrentPageName(),
    });

    onClose?.();
    navigationStepManager.reset();
    reset();
  };

  const hasOneCurrency = useMemo(() => {
    return haveOneCommonProvider(currencyIdsArray, currenciesByProvider);
  }, [currencyIdsArray, currenciesByProvider]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={!hasOneCurrency && isOpen}
      onClose={handleDrawerClose}
      hasBackButton={navigationStepManager.hasBackButton}
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
        isReadyToBeDisplayed={isReadyToBeDisplayed}
      />
    </QueuedDrawer>
  );
}
