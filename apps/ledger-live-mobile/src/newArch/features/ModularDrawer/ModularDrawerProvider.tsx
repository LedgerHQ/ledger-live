import React from "react";
import { ModularDrawer } from "./ModularDrawer";
import { useModularDrawerStore } from "./hooks/useModularDrawerStore";

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
  } = useModularDrawerStore();

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
        // TODO FIX with flow and source
        flow="default_flow"
        source="default_source"
      />
    </>
  );
}
