import React, { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import type { ContentCard } from "@braze/react-native-sdk";
import type { EligibilityContext } from "@ledgerhq/live-common/braze/localEligibility";
import type { ContentCardEligibilityEvaluation } from "LLM/features/DynamicContent/utils/filterEligibleContentCards";
import { useBrazeContentCardsProviderViewModel } from "./useBrazeContentCardsProviderViewModel";

type BrazeContentCardsContextValue = {
  prepareForIdentityTransition: () => void;
  refreshContentCards: () => Promise<void>;
  lastFetchedCards: ContentCard[] | null;
  eligibilityEvaluations: ContentCardEligibilityEvaluation[];
  eligibilityContext: EligibilityContext;
};

const BrazeContentCardsContext = createContext<BrazeContentCardsContextValue>({
  prepareForIdentityTransition: () => {},
  refreshContentCards: () => Promise.resolve(),
  lastFetchedCards: null,
  eligibilityEvaluations: [],
  eligibilityContext: { hasFunds: false, isOnboarded: false, hasStax: false },
});

export function BrazeContentCardsProvider({ children }: PropsWithChildren) {
  const {
    prepareForIdentityTransition,
    refreshContentCards,
    lastFetchedCards,
    eligibilityEvaluations,
    eligibilityContext,
  } = useBrazeContentCardsProviderViewModel();
  const value = useMemo(
    () => ({
      prepareForIdentityTransition,
      refreshContentCards,
      lastFetchedCards,
      eligibilityEvaluations,
      eligibilityContext,
    }),
    [
      prepareForIdentityTransition,
      refreshContentCards,
      lastFetchedCards,
      eligibilityEvaluations,
      eligibilityContext,
    ],
  );

  return (
    <BrazeContentCardsContext.Provider value={value}>{children}</BrazeContentCardsContext.Provider>
  );
}

export function useBrazeContentCards() {
  return useContext(BrazeContentCardsContext);
}
