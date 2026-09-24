import React, { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import type { Card } from "@braze/web-sdk";
import type { EligibilityContext } from "@ledgerhq/live-common/braze/localEligibility";
import type { ContentCardEligibilityEvaluation } from "LLD/features/DynamicContent/utils/filterEligibleContentCards";
import { useBrazeProviderViewModel, type DebugBrazeContentCard } from "./useBrazeProviderViewModel";

export type { DebugBrazeContentCard };

type BrazeContextValue = {
  prepareForIdentityTransition: () => void;
  refreshContentCards: () => Promise<void>;
  lastFetchedCards: Card[] | null;
  eligibilityEvaluations: ContentCardEligibilityEvaluation[];
  eligibilityContext: EligibilityContext;
  injectDebugContentCard: (card: DebugBrazeContentCard) => void;
};

const emptyEligibilityContext: EligibilityContext = {
  hasFunds: false,
  isOnboarded: false,
  hasStax: false,
};

const BrazeContext = createContext<BrazeContextValue>({
  prepareForIdentityTransition: () => {},
  refreshContentCards: () => Promise.resolve(),
  lastFetchedCards: null,
  eligibilityEvaluations: [],
  eligibilityContext: emptyEligibilityContext,
  injectDebugContentCard: () => {},
});

export function BrazeProvider({ children }: PropsWithChildren) {
  const {
    prepareForIdentityTransition,
    refreshContentCards,
    lastFetchedCards,
    eligibilityEvaluations,
    eligibilityContext,
    injectDebugContentCard,
  } = useBrazeProviderViewModel();
  const value = useMemo(
    () => ({
      prepareForIdentityTransition,
      refreshContentCards,
      lastFetchedCards,
      eligibilityEvaluations,
      eligibilityContext,
      injectDebugContentCard,
    }),
    [
      prepareForIdentityTransition,
      refreshContentCards,
      lastFetchedCards,
      eligibilityEvaluations,
      eligibilityContext,
      injectDebugContentCard,
    ],
  );

  return <BrazeContext.Provider value={value}>{children}</BrazeContext.Provider>;
}

export function useBraze() {
  return useContext(BrazeContext);
}
