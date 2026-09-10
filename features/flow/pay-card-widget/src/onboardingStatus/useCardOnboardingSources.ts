import { useMemo } from "react";
import { useGetCardStatusQuery, useGetUserQuery } from "@domain/api-card-management";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import { hasPositiveBalance, type CardOnboardingSignals } from "./deriveCardOnboardingStatus";
import type { CardOnboardingProviderStepId } from "./steps";

export type CardOnboardingSourcesParams = {
  /**
   * Holds every read. The Card endpoints need a session, so a host that is signed out sets this
   * rather than collecting 401s; while it is set, every step reads as not done.
   */
  readonly skip?: boolean;
};

export type CardOnboardingSources = {
  readonly signals: CardOnboardingSignals<CardOnboardingProviderStepId>;
  readonly isLoading: boolean;
  readonly isError: boolean;
};

const NO_COUNTER_VALUE = () => null;

/**
 * Asks the Card endpoints what they can answer about onboarding.
 *
 * The provider serves no onboarding endpoint: each step is a different question, so they are asked
 * separately here and joined by the platform hook, which knows which steps its dialog lists. A step
 * nothing can answer yet reads as not done.
 */
export function useCardOnboardingSources({
  skip = false,
}: CardOnboardingSourcesParams = {}): CardOnboardingSources {
  const user = useGetUserQuery(undefined, { skip });
  const cardStatus = useGetCardStatusQuery(undefined, { skip });
  const linkedWallets = useCardLinkedWallets({ resolveCounterValue: NO_COUNTER_VALUE, skip });

  const signals = useMemo(
    () => ({
      "create-account": user.data?.verificationState === "VERIFIED",
      // Any card the provider answers with is a card: a frozen or blocked one was still ordered,
      // and reading it as "no card" would send the holder back to choosing a type.
      "choose-card-type": cardStatus.data !== undefined,
      "top-up-card": linkedWallets.wallets.some(({ balance }) => hasPositiveBalance(balance)),
      // Nothing reads the provider's transactions yet.
      "first-purchase": false,
    }),
    [user.data, cardStatus.data, linkedWallets.wallets],
  );

  return {
    signals,
    // `isFetching` on all three, not `isLoading`: a query reports `isLoading` only while it has no
    // data, so after the first read a refetch would have looked idle.
    isLoading: user.isFetching || cardStatus.isFetching || linkedWallets.isFetching,
    // A step that cannot be answered is reported as not done, so only a failure the holder can do
    // nothing about is surfaced: the account read itself.
    isError: user.isError,
  };
}
