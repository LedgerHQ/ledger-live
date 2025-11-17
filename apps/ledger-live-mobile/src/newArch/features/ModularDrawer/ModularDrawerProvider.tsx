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
    closeDrawer,
    handleAccountSelected,
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
        assetsConfiguration={assetsConfiguration}
        networksConfiguration={networksConfiguration}
        onAccountSelected={handleAccountSelected}
        useCase={useCase}
        areCurrenciesFiltered={areCurrenciesFiltered}
      />
    </>
  );
}
