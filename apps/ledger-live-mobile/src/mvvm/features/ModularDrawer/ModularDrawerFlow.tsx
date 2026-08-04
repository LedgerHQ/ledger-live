import React from "react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { useModularDrawerConfiguration } from "@ledgerhq/live-common/modularDrawer/hooks/useModularDrawerConfiguration";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import {
  modularDrawerCompletionModeSelector,
  modularDrawerEnableAccountSelectionSelector,
  modularDrawerSearchValueSelector,
} from "~/reducers/modularDrawer";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { useAssets } from "./hooks/useAssets";
import { useModularDrawerState } from "./hooks/useModularDrawerState";

export type ModularDrawerFlowRenderProps = Readonly<{
  /** Existing Modular Drawer flow to render in the chosen presentation shell */
  content: React.JSX.Element;
  /** Whether the current Modular Drawer step can navigate back */
  hasBackButton: boolean;
  /** Whether the presentation shell should request to be opened */
  isRequestingToBeOpened: boolean;
  /** Navigates to the previous Modular Drawer step */
  onBack: () => void;
  /** Closes the Modular Drawer and runs its existing cleanup */
  onClose: () => void;
}>;

/**
 * Props for the presentation-independent Modular Drawer content.
 */
export type ModularDrawerFlowProps = Readonly<{
  /** Whether the drawer flow is open */
  isOpen: boolean;
  /** Callback fired when the drawer flow is closed */
  onClose?: () => void;

  /** List of preselected currencies to display in the drawer */
  currencies?: string[];
  /** Configuration for assets display */
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  /** Configuration for networks display */
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];

  /** Callback fired when an account is selected */
  onAccountSelected: (account: AccountLike, parentAccount?: AccountLike) => void;
  /** Callback fired after the final asset and network are resolved in currency mode */
  onCurrencySelected?: (currency: CryptoOrTokenCurrency) => void;

  /** The use case identifier for the drawer (sent to API as transaction param) */
  useCase?: string;
  /** UI-only use case identifier for conditional rendering (e.g. perpetuals banner) */
  uiUseCase?: string;
  /** Whether the currencies are filtered */
  areCurrenciesFiltered?: boolean;

  /** Renders the Modular Drawer flow inside a presentation shell */
  children: (props: ModularDrawerFlowRenderProps) => React.ReactNode;
}>;

export function ModularDrawerFlow({
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
  children,
}: ModularDrawerFlowProps): React.JSX.Element {
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

  const content = (
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
        uiUseCase,
      }}
      networksViewModel={{
        onNetworkSelected: handleNetwork,
        availableNetworks,
        networksConfiguration: networkConfigurationSanitized,
      }}
      accountsViewModel={{
        onAddNewAccount,
        asset: accountCurrency,
        onAccountSelected,
        uiUseCase,
      }}
    />
  );

  return (
    <>
      {children({
        content,
        hasBackButton: shouldShowBackButton,
        isRequestingToBeOpened: (!hasOneCurrency || Boolean(enableAccountSelection)) && isOpen,
        onBack: handleBackButton,
        onClose: handleCloseButton,
      })}
    </>
  );
}
