import type { CardOnboardingStepId } from "./steps";

export type CardOnboardingStep = {
  readonly id: CardOnboardingStepId;
  readonly isDone: boolean;
};

export type CardOnboardingStatus = {
  readonly steps: readonly CardOnboardingStep[];
  readonly completedCount: number;
};

/** One answer per listed step, so a step the platform lists can never be left unanswered. */
export type CardOnboardingSignals<Id extends CardOnboardingStepId = CardOnboardingStepId> =
  Readonly<Record<Id, boolean>>;

/**
 * Joins each answer onto the step it belongs to, and counts what is done.
 *
 * The steps are passed in rather than read from the catalog, because platforms list different ones:
 * the count then belongs to whoever asked, and no consumer has to recount.
 */
export function deriveCardOnboardingStatus<Id extends CardOnboardingStepId>(
  steps: readonly Id[],
  signals: CardOnboardingSignals<Id>,
): CardOnboardingStatus {
  const derived = steps.map(id => ({ id, isDone: signals[id] }));

  return { steps: derived, completedCount: derived.filter(({ isDone }) => isDone).length };
}

/**
 * Whether a wallet holds anything at all.
 *
 * Balances arrive as strings the provider formatted, and an unread one is `null`. Neither `"0.00"`
 * nor an absent balance counts as topped up.
 */
export function hasPositiveBalance(balance: string | null): boolean {
  if (balance === null) return false;

  const amount = Number(balance);
  return Number.isFinite(amount) && amount > 0;
}
