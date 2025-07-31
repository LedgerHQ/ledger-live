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
    flow,
    source,
  } = useModularDrawerController();

  return (
    <>
      {children}
      <ModularDrawer
        isOpen={isOpen}
        currencies={preselectedCurrencies}
        onClose={closeDrawer}
        enableAccountSelection={enableAccountSelection}
        onAccountSelected={handleAccountSelected}
        accounts$={getAccountsObservable()}
        flow={flow ?? ""}
        source={source ?? ""}
      />
    </>
  );
}
