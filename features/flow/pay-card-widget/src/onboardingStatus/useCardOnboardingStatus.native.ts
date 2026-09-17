import { useMemo } from "react";
import { useSelector } from "react-redux";
import { deriveCardOnboardingStatus } from "./deriveCardOnboardingStatus";
import { CARD_ONBOARDING_STEPS_WITH_WALLET } from "./steps";
import { selectHasAddedCardToWallet } from "../state";
import type { UseCardOnboardingStatusResult } from "./types";
import {
  useCardOnboardingSources,
  type CardOnboardingSourcesParams,
} from "./useCardOnboardingSources";

/**
 * Mobile lists one step more: the card can be carried in the phone's wallet.
 *
 * The provider answers it where the tenant supports the flag; otherwise the holder says so by
 * pressing the step, and that answer is kept on the device.
 */
export function useCardOnboardingStatus(
  params: CardOnboardingSourcesParams = {},
): UseCardOnboardingStatusResult {
  const { signals, cardAddedToDigitalWallet, isLoading, isError, refresh } =
    useCardOnboardingSources(params);
  const hasAddedCardToWallet = useSelector(selectHasAddedCardToWallet);

  const data = useMemo(
    () =>
      deriveCardOnboardingStatus(CARD_ONBOARDING_STEPS_WITH_WALLET, {
        ...signals,
        "apple-google-pay": cardAddedToDigitalWallet ?? hasAddedCardToWallet,
      }),
    [signals, cardAddedToDigitalWallet, hasAddedCardToWallet],
  );

  return { data, isLoading, isError, refresh };
}
