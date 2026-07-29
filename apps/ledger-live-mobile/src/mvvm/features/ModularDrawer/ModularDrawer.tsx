import React from "react";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { useAssets } from "./hooks/useAssets";
import { useModularDrawerState } from "./hooks/useModularDrawerState";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";

import { AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useSelector } from "~/context/hooks";
import {
  modularDrawerCompletionModeSelector,
  modularDrawerEnableAccountSelectionSelector,
  modularDrawerSearchValueSelector,
} from "~/reducers/modularDrawer";

import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";

const SNAP_POINTS = ["70%", "92%"];

/**
 * Props for the ModularDrawer component.
 */
export type ModularDrawerProps = {
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
  readonly onAccountSelected: (account: AccountLike, parentAccount?: AccountLike) => void;
  /** Callback fired after the final asset and network are resolved in currency mode */
  readonly onCurrencySelected?: (currency: CryptoOrTokenCurrency) => void;

  /** The use case identifier for the drawer (sent to API as transaction param) */
  readonly useCase?: string;
  /** UI-only use case identifier for conditional rendering (e.g. perpetuals banner) */
  readonly uiUseCase?: string;
  /** Whether the currencies are filtered */
  readonly areCurrenciesFiltered?: boolean;
};

/**
 * ModularDrawer is a generic drawer component for asset/network selection flows.
 * Handles navigation steps, asset/network selection, and drawer state.
 */
export function ModularDrawer({
  isOpen,
  onClose,
  currencies,
  assetsConfiguration,
  networksConfiguration,
  onAccountSelected,
  onCurrencySelected,
  useCase,
  uiUseCase,
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
  const completionMode = useSelector(modularDrawerCompletionModeSelector);
  const { sortedCryptoCurrencies, assetsSorted, isLoading, isError, refetch, loadNext } = useAssets(
    {
      currencyIds: completionMode === "currency" ? undefined : currencies,
      networkIds: completionMode === "currency" ? currencies : undefined,
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
    currencyIds: completionMode === "currency" ? [] : (currencies ?? []),
    isDrawerOpen: isOpen,
    onClose,
    hasSearchedValue: searchValue.length > 0,
    onAccountSelected,
    onCurrencySelected,
  });

  const flowManagerProps = {
    assetsViewModel: {
      availableAssets: sortedCryptoCurrencies,
      onAssetSelected: handleAsset,
      assetsConfiguration: assetsConfigurationSanitized,
      isOpen,
      isLoading,
      hasError: isError,
      refetch,
      loadNext,
      assetsSorted,
    },
    networksViewModel: {
      onNetworkSelected: handleNetwork,
      availableNetworks,
      networksConfiguration: networkConfigurationSanitized,
    },
    accountsViewModel: {
      onAddNewAccount,
      asset: accountCurrency,
      onAccountSelected,
      uiUseCase,
    },
  };

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={(!hasOneCurrency || enableAccountSelection) && isOpen}
      onClose={handleCloseButton}
      enableBlurKeyboardOnGesture={true}
      snapPoints={SNAP_POINTS}
      hasBackButton={shouldShowBackButton}
      onBack={handleBackButton}
      enablePanDownToClose
    >
      <ModularDrawerFlowManager {...flowManagerProps} />
    </QueuedBottomSheet>
  );
}
