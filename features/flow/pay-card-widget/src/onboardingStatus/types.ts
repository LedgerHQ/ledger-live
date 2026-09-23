import type { CardOnboardingStatus } from "./deriveCardOnboardingStatus";

export type UseCardOnboardingStatusResult = {
  /**
   * Always answered. Every signal has a value from the first render — a step nothing has answered
   * yet reads as not done — so there is no "not known" state for a consumer to handle.
   */
  readonly data: CardOnboardingStatus;
  /** The first read only. A refetch reports through `isFetching`. */
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly hasSourceError: boolean;
  /** Re-asks all four sources. The widget never needs it; the devtool does. */
  readonly refresh: () => void;
};
