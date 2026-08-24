import React from "react";
import { ModularDrawer } from "./ModularDrawer";
import { useModularDrawerController } from "./hooks/useModularDrawerController";

export function ModularDrawerWrapper() {
  const {
    isOpen,
    preselectedCurrencies,
    categories,
    closeDrawer,
    handleAccountSelected,
    handleCurrencySelected,
    presentation,
    assetsConfiguration,
    networksConfiguration,
    useCase,
    uiUseCase,
    areCurrenciesFiltered,
  } = useModularDrawerController();

  if (presentation === "embedded") {
    return null;
  }

  return (
    <ModularDrawer
      isOpen={isOpen}
      currencies={preselectedCurrencies}
      categories={categories}
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
