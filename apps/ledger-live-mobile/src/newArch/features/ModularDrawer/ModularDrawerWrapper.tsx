import React from "react";
import { ModularDrawer } from "./ModularDrawer";
import { useModularDrawerController } from "./hooks/useModularDrawerController";

export function ModularDrawerWrapper() {
  const {
    isOpen,
    preselectedCurrencies,
    closeDrawer,
    handleAccountSelected,
    getAccountsObservable,
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
      accounts$={getAccountsObservable()}
      useCase={useCase}
      areCurrenciesFiltered={areCurrenciesFiltered}
    />
  );
}
