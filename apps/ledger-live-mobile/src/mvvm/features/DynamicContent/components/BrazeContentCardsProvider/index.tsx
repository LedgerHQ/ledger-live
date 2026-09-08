import React, { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { useBrazeContentCardsProviderViewModel } from "./useBrazeContentCardsProviderViewModel";

type BrazeContentCardsContextValue = {
  prepareForIdentityTransition: () => void;
  refreshContentCards: () => Promise<void>;
};

const BrazeContentCardsContext = createContext<BrazeContentCardsContextValue>({
  prepareForIdentityTransition: () => {},
  refreshContentCards: () => Promise.resolve(),
});

export function BrazeContentCardsProvider({ children }: PropsWithChildren) {
  const { prepareForIdentityTransition, refreshContentCards } =
    useBrazeContentCardsProviderViewModel();
  const value = useMemo(
    () => ({ prepareForIdentityTransition, refreshContentCards }),
    [prepareForIdentityTransition, refreshContentCards],
  );

  return (
    <BrazeContentCardsContext.Provider value={value}>{children}</BrazeContentCardsContext.Provider>
  );
}

export function useBrazeContentCards() {
  return useContext(BrazeContentCardsContext);
}
