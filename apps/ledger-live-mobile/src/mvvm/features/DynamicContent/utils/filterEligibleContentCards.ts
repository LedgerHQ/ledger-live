import {
  evaluateLocalEligibility,
  parseRequiredStates,
  type EligibilityContext,
  type EligibilityResult,
} from "@ledgerhq/live-common/braze/localEligibility";

export type ContentCardEligibilityEvaluation = {
  id: string;
  requiredStates: string[];
  result: EligibilityResult;
};

type EligibleContentCard = {
  id: string;
  extras?: Record<string, string>;
};

export function filterEligibleContentCards<T extends EligibleContentCard>(
  cards: T[],
  context: EligibilityContext,
): { eligibleCards: T[]; evaluations: ContentCardEligibilityEvaluation[] } {
  const evaluations: ContentCardEligibilityEvaluation[] = [];
  const eligibleCards: T[] = [];

  for (const card of cards) {
    const result = evaluateLocalEligibility(card, context);
    evaluations.push({
      id: card.id,
      requiredStates: parseRequiredStates(card.extras?.requiredStates),
      result,
    });
    if (result.eligible) {
      eligibleCards.push(card);
    }
  }

  return { eligibleCards, evaluations };
}
