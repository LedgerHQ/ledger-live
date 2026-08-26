import React, { useCallback, useRef } from "react";
import { ModularDrawer } from "./ModularDrawer";
import { useModularDrawerController } from "./hooks/useModularDrawerController";

export function ModularDrawerWrapper() {
  const {
    isOpen,
    preselectedCurrencies,
    categories,
    closeDrawer,
    hideDrawer,
    handleAccountSelected,
    handleCurrencySelected,
    presentation,
    assetsConfiguration,
    networksConfiguration,
    useCase,
    uiUseCase,
    areCurrenciesFiltered,
  } = useModularDrawerController();

  // Prevents QueuedBottomSheet cleanup from firing cancel after a silent hide.
  const silentHideRef = useRef(false);

  const onSilentClose = useCallback(() => {
    silentHideRef.current = true;
    hideDrawer();
  }, [hideDrawer]);

  const onClose = useCallback(() => {
    if (silentHideRef.current) {
      silentHideRef.current = false;
      return;
    }
    closeDrawer();
  }, [closeDrawer]);

  if (presentation === "embedded") {
    return null;
  }

  return (
    <ModularDrawer
      isOpen={isOpen}
      currencies={preselectedCurrencies}
      categories={categories}
      onClose={onClose}
      onSilentClose={onSilentClose}
      assetsConfiguration={assetsConfiguration}
      networksConfiguration={networksConfiguration}
      onAccountSelected={handleAccountSelected}
      onCurrencySelected={handleCurrencySelected}
      useCase={useCase}
      uiUseCase={uiUseCase}
      areCurrenciesFiltered={areCurrenciesFiltered}
    />
  );
}
