import type { PayCardOnboardingWidgetState } from "./types";

type PayCardOnboardingWidgetStateRoot = {
  payCardOnboardingWidget: PayCardOnboardingWidgetState;
};

export function selectHasCompletedCardOnboarding(state: PayCardOnboardingWidgetStateRoot): boolean {
  return state.payCardOnboardingWidget.hasCompletedOnboarding;
}

export function selectHasAddedCardToWallet(state: PayCardOnboardingWidgetStateRoot): boolean {
  return state.payCardOnboardingWidget.hasAddedCardToWallet;
}

export function payCardOnboardingWidgetPersistedSelector(
  state: PayCardOnboardingWidgetStateRoot,
): PayCardOnboardingWidgetState {
  return {
    hasCompletedOnboarding: state.payCardOnboardingWidget.hasCompletedOnboarding,
    hasAddedCardToWallet: state.payCardOnboardingWidget.hasAddedCardToWallet,
  };
}
