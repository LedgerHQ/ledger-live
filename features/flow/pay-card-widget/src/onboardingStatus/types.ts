import type { CardOnboardingStatus } from "./deriveCardOnboardingStatus";

export type UseCardOnboardingStatusResult = {
  /**
   * Always answered. Every signal has a value from the first render — a step nothing has answered
   * yet reads as not done — so there is no "not known" state for a consumer to handle.
   */
  readonly data: CardOnboardingStatus;
  readonly isLoading: boolean;
  readonly isError: boolean;
};
