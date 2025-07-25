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
    onAccountSelected,
    accounts$,
  } = useModularDrawerStore();

  return (
    <>
      {children}
      <ModularDrawer
        isOpen={isOpen}
        currencies={preselectedCurrencies}
        onClose={closeDrawer}
        enableAccountSelection={enableAccountSelection}
        onAccountSelected={onAccountSelected}
        accounts$={accounts$}
      />
    </>
  );
}
