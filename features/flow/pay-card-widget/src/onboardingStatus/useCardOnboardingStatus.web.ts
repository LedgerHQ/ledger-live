import { useMemo } from "react";
import { deriveCardOnboardingStatus } from "./deriveCardOnboardingStatus";
import { CARD_ONBOARDING_STEPS } from "./steps";
import type { UseCardOnboardingStatusResult } from "./types";
import {
  useCardOnboardingSources,
  type CardOnboardingSourcesParams,
} from "./useCardOnboardingSources";

/** Desktop lists four steps: there is no phone wallet to put the card in. */
export function useCardOnboardingStatus(
  params: CardOnboardingSourcesParams = {},
): UseCardOnboardingStatusResult {
  const { signals, isLoading, isError, refresh } = useCardOnboardingSources(params);

  const data = useMemo(() => deriveCardOnboardingStatus(CARD_ONBOARDING_STEPS, signals), [signals]);

  return { data, isLoading, isError, refresh };
}
