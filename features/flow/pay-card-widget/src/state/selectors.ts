import type { PayCardOnboardingWidgetState } from "./types";

type PayCardOnboardingWidgetStateRoot = {
  payCardOnboardingWidget: PayCardOnboardingWidgetState;
};

export function selectHasCompletedCardOnboarding(state: PayCardOnboardingWidgetStateRoot): boolean {
  return state.payCardOnboardingWidget.hasCompletedOnboarding;
}

export function payCardOnboardingWidgetPersistedSelector(
  state: PayCardOnboardingWidgetStateRoot,
): PayCardOnboardingWidgetState {
  return {
    hasCompletedOnboarding: state.payCardOnboardingWidget.hasCompletedOnboarding,
  };
}
