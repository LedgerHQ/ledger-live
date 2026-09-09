import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { PayCardOnboardingStep } from "@domain/api-card-management";
import { useTranslation } from "@shared/i18n";
import { selectHasAddedCardToWallet } from "../../state";

export function useOnboardingSteps(
  steps: readonly PayCardOnboardingStep[],
): readonly PayCardOnboardingStep[] {
  const { t } = useTranslation();
  const isDone = useSelector(selectHasAddedCardToWallet);

  return useMemo(() => {
    if (steps.length === 0) return steps;

    const walletStep: PayCardOnboardingStep = {
      id: "apple-google-pay",
      title: t("payTab.cardOnboarding.walletStep.title"),
      description: t("payTab.cardOnboarding.walletStep.description"),
      isDone,
    };

    return [...steps.slice(0, -1), walletStep, ...steps.slice(-1)];
  }, [steps, t, isDone]);
}
