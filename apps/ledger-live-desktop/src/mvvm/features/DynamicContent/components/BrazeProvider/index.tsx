import React, { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { useBrazeProviderViewModel } from "./useBrazeProviderViewModel";

type BrazeContextValue = {
  prepareForIdentityTransition: () => void;
  refreshContentCards: () => Promise<void>;
};

const BrazeContext = createContext<BrazeContextValue>({
  prepareForIdentityTransition: () => {},
  refreshContentCards: () => Promise.resolve(),
});

export function BrazeProvider({ children }: PropsWithChildren) {
  const { prepareForIdentityTransition, refreshContentCards } = useBrazeProviderViewModel();
  const value = useMemo(
    () => ({ prepareForIdentityTransition, refreshContentCards }),
    [prepareForIdentityTransition, refreshContentCards],
  );

  return <BrazeContext.Provider value={value}>{children}</BrazeContext.Provider>;
}

export function useBraze() {
  return useContext(BrazeContext);
}
