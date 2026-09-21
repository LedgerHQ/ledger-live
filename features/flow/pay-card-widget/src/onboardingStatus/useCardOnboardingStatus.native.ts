import { useMemo } from "react";
import { deriveCardOnboardingStatus } from "./deriveCardOnboardingStatus";
import { CARD_ONBOARDING_STEPS_WITH_WALLET } from "./steps";
import type { UseCardOnboardingStatusResult } from "./types";
import {
  useCardOnboardingSources,
  type CardOnboardingSourcesParams,
} from "./useCardOnboardingSources";

/**
 * Mobile lists one step more: the card can be carried in the phone's wallet.
 *
 * Only the provider answers it. A tenant that does not send the flag leaves the step undone, which
 * is the honest reading: nothing has told us the card is in the wallet.
 */
export function useCardOnboardingStatus(
  params: CardOnboardingSourcesParams = {},
): UseCardOnboardingStatusResult {
  const { signals, cardAddedToDigitalWallet, isLoading, isError, refresh } =
    useCardOnboardingSources(params);

  const data = useMemo(
    () =>
      deriveCardOnboardingStatus(CARD_ONBOARDING_STEPS_WITH_WALLET, {
        ...signals,
        "apple-google-pay": cardAddedToDigitalWallet ?? false,
      }),
    [signals, cardAddedToDigitalWallet],
  );

  return { data, isLoading, isError, refresh };
}
