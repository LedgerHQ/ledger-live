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
 * No endpoint answers whether it is, so the holder says so by pressing the step and the answer is
 * kept on the device.
 */
export function useCardOnboardingStatus(
  params: CardOnboardingSourcesParams = {},
): UseCardOnboardingStatusResult {
  const { signals, isLoading, isError, refresh } = useCardOnboardingSources(params);
  const hasAddedCardToWallet = useSelector(selectHasAddedCardToWallet);

  const data = useMemo(
    () =>
      deriveCardOnboardingStatus(CARD_ONBOARDING_STEPS_WITH_WALLET, {
        ...signals,
        "apple-google-pay": hasAddedCardToWallet,
      }),
    [signals, hasAddedCardToWallet],
  );

  return { data, isLoading, isError, refresh };
}
