import { useCallback, useMemo } from "react";
import {
  useGetCardStatusQuery,
  useGetCardTransactionsInfiniteQuery,
  useGetUserQuery,
} from "@domain/api-card-management";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import { hasPositiveBalance, type CardOnboardingSignals } from "./deriveCardOnboardingStatus";
import type { CardOnboardingProviderStepId } from "./steps";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type CardOnboardingSourcesParams = {
  /**
   * Holds every read. The Card endpoints need a session, so a host that is signed out sets this
   * rather than collecting 401s; while it is set, every step reads as not done.
   */
  readonly skip?: boolean;
};

export type CardOnboardingSources = {
  readonly signals: CardOnboardingSignals<CardOnboardingProviderStepId>;
  /**
   * Whether the card sits in the phone's wallet, or `undefined` from a tenant that does not answer
   * for it. Not a signal: a step nothing answered is for the platform to decide, and only mobile
   * lists this one.
   */
  readonly cardAddedToDigitalWallet: boolean | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly hasSourceError: boolean;
  readonly refresh: () => void;
};

const NO_CURRENCIES: ReadonlyMap<string, CryptoOrTokenCurrency> = new Map();

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
  const transactions = useGetCardTransactionsInfiniteQuery(undefined, { skip });
  const linkedWallets = useCardLinkedWallets({ currencies: NO_CURRENCIES, skip });

  const signals = useMemo(
    () => ({
      "create-account": user.data?.verificationState === "VERIFIED",
      // Any card the provider answers with is a card: a frozen or blocked one was still ordered,
      // and reading it as "no card" would send the holder back to choosing a type.
      "choose-card-type": cardStatus.data !== undefined,
      "top-up-card": linkedWallets.wallets.some(({ balance }) => hasPositiveBalance(balance)),
      // Every page read, not just the first: the newest page can hold nothing but pending or
      // declined attempts while an older charge did settle.
      "first-purchase": (transactions.data?.pages ?? []).some(page =>
        page.some(({ status }) => status === "CONFIRMED"),
      ),
    }),
    [user.data, cardStatus.data, linkedWallets.wallets, transactions.data],
  );

  const { refetch: refetchUser } = user;
  const { refetch: refetchCardStatus } = cardStatus;
  const { refetch: refetchTransactions } = transactions;
  const { refetch: refetchWallets } = linkedWallets;

  const refresh = useCallback(() => {
    // Nothing was started while skipped, and RTK throws when asked to refetch that.
    if (skip) {
      return;
    }

    refetchUser();
    refetchCardStatus();
    refetchTransactions();
    refetchWallets();
  }, [skip, refetchUser, refetchCardStatus, refetchTransactions, refetchWallets]);

  return {
    signals,
    cardAddedToDigitalWallet: cardStatus.data?.cardAddedToDigitalWallet,
    refresh,
    isLoading:
      user.isLoading || cardStatus.isLoading || transactions.isLoading || linkedWallets.isLoading,
    // A step that cannot be answered is reported as not done, so only a failure the holder can do
    // nothing about is surfaced: the account read itself.
    isError: user.isError,
    hasSourceError:
      user.isError || cardStatus.isError || transactions.isError || linkedWallets.isError,
  };
}
