import React from "react";
import { ModularDrawer } from "./ModularDrawer";
import { useModularDrawerController } from "./hooks/useModularDrawerController";

export function ModularDrawerWrapper() {
  const {
    isOpen,
    preselectedCurrencies,
    closeDrawer,
    handleAccountSelected,
    handleCurrencySelected,
    assetsConfiguration,
    networksConfiguration,
    useCase,
    uiUseCase,
    areCurrenciesFiltered,
  } = useModularDrawerController();

  return (
    <ModularDrawer
      isOpen={isOpen}
      currencies={preselectedCurrencies}
      onClose={closeDrawer}
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
