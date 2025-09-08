import React from "react";
import { ModularDrawer } from "./ModularDrawer";
import { useModularDrawerController } from "./hooks/useModularDrawerController";

type ModularDrawerProviderProps = {
  children: React.ReactNode;
};

export function ModularDrawerProvider({ children }: ModularDrawerProviderProps) {
  const {
    isOpen,
    preselectedCurrencies,
    enableAccountSelection,
    closeDrawer,
    handleAccountSelected,
    getAccountsObservable,
    assetsConfiguration,
    networksConfiguration,
    useCase,
    areCurrenciesFiltered,
  } = useModularDrawerController();

  return (
    <>
      {children}
      <ModularDrawer
        isOpen={isOpen}
        currencies={preselectedCurrencies}
        onClose={closeDrawer}
        enableAccountSelection={enableAccountSelection}
        assetsConfiguration={assetsConfiguration}
        networksConfiguration={networksConfiguration}
        onAccountSelected={handleAccountSelected}
        accounts$={getAccountsObservable()}
        useCase={useCase}
        areCurrenciesFiltered={areCurrenciesFiltered}
      />
    </>
  );
}
