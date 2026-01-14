import React from "react";
import { ModularDrawer } from "./ModularDrawer";
import { useModularDrawerController } from "./hooks/useModularDrawerController";

export function ModularDrawerWrapper() {
  const {
    isOpen,
    preselectedCurrencies,
    closeDrawer,
    handleAccountSelected,
    assetsConfiguration,
    networksConfiguration,
    useCase,
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
      useCase={useCase}
      areCurrenciesFiltered={areCurrenciesFiltered}
    />
  );
}
