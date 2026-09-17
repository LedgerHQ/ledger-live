import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { CardOnboardingStep, CardOnboardingStepId } from "../../onboardingStatus";

export type CardOnboardingStepWithCopy = {
  readonly id: CardOnboardingStepId;
  readonly title: string;
  readonly description: string;
  readonly isDone: boolean;
};

/**
 * Copy belongs to whatever renders the steps (see `onboardingStatus/steps.ts`), so it is attached
 * here rather than carried by the derived status. `apple-google-pay` only ever appears in the step
 * list mobile asks for; it is listed unconditionally because every id needs an answer, not because
 * desktop renders it.
 */
const STEP_COPY: Record<CardOnboardingStepId, { titleKey: string; descriptionKey: string }> = {
  "create-account": {
    titleKey: "payTab.cardOnboarding.steps.createAccount.title",
    descriptionKey: "payTab.cardOnboarding.steps.createAccount.description",
  },
  "choose-card-type": {
    titleKey: "payTab.cardOnboarding.steps.chooseCardType.title",
    descriptionKey: "payTab.cardOnboarding.steps.chooseCardType.description",
  },
  "top-up-card": {
    titleKey: "payTab.cardOnboarding.steps.topUpCard.title",
    descriptionKey: "payTab.cardOnboarding.steps.topUpCard.description",
  },
  "apple-google-pay": {
    titleKey: "payTab.cardOnboarding.steps.appleGooglePay.title",
    descriptionKey: "payTab.cardOnboarding.steps.appleGooglePay.description",
  },
  "first-purchase": {
    titleKey: "payTab.cardOnboarding.steps.firstPurchase.title",
    descriptionKey: "payTab.cardOnboarding.steps.firstPurchase.description",
  },
};

export function useOnboardingSteps(
  steps: readonly CardOnboardingStep[],
): readonly CardOnboardingStepWithCopy[] {
  const { t } = useTranslation();

  return useMemo(
    () =>
      steps.map(({ id, isDone }) => ({
        id,
        title: t(STEP_COPY[id].titleKey),
        description: t(STEP_COPY[id].descriptionKey),
        isDone,
      })),
    [steps, t],
  );
}
