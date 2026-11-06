import { OnboardingStep } from "@features/platform-device-onboarding";
import type { TFunction } from "i18next";

export function lastSavedStepName(
  state: string | null,
  setupStep: string | null | undefined,
  t: TFunction,
): string {
  switch (setupStep) {
    case OnboardingStep.ChooseName:
      return t("deviceOnboarding.quitConfirmation.steps.name");
    case OnboardingStep.Pin:
      return t("deviceOnboarding.quitConfirmation.steps.pin");
    case OnboardingStep.SetupChoice:
      return t("deviceOnboarding.quitConfirmation.steps.setupChoice");
    case OnboardingStep.NewDevice:
    case OnboardingStep.NewDeviceConfirming:
      return t("deviceOnboarding.quitConfirmation.steps.security");
    case OnboardingStep.SetupChoiceRestore:
    case OnboardingStep.RestoreSeed:
    case OnboardingStep.RestoreCharon:
    case OnboardingStep.RecoverRestore:
      return t("deviceOnboarding.quitConfirmation.steps.restore");
    default:
      return state?.startsWith("checks.")
        ? t("deviceOnboarding.quitConfirmation.steps.checks")
        : t("deviceOnboarding.quitConfirmation.steps.intro");
  }
}
