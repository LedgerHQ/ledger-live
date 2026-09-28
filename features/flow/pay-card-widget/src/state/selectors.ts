import type { PayCardOnboardingWidgetState } from "./types";

type PayCardOnboardingWidgetStateRoot = {
  payCardOnboardingWidget: PayCardOnboardingWidgetState;
};

export function selectHasCompletedCardOnboarding(state: PayCardOnboardingWidgetStateRoot): boolean {
  return state.payCardOnboardingWidget.hasCompletedOnboarding;
}

export function selectReportedAnalyticsMilestones(
  state: PayCardOnboardingWidgetStateRoot,
): PayCardOnboardingWidgetState["reportedAnalyticsMilestones"] {
  return state.payCardOnboardingWidget.reportedAnalyticsMilestones;
}

export function selectAnalyticsCardId(state: PayCardOnboardingWidgetStateRoot): string | null {
  return state.payCardOnboardingWidget.analyticsCardId ?? null;
}

export function selectHasReadCardAccount(state: PayCardOnboardingWidgetStateRoot): boolean {
  return state.payCardOnboardingWidget.hasReadCardAccount ?? false;
}

export function payCardOnboardingWidgetPersistedSelector(
  state: PayCardOnboardingWidgetStateRoot,
): PayCardOnboardingWidgetState {
  const reportedAnalyticsMilestones = (
    state.payCardOnboardingWidget.reportedAnalyticsMilestones ?? []
  ).filter(milestone => milestone !== "card-onboarding-in-progress");

  return {
    hasCompletedOnboarding: state.payCardOnboardingWidget.hasCompletedOnboarding,
    analyticsCardId: state.payCardOnboardingWidget.analyticsCardId ?? null,
    reportedAnalyticsMilestones,
    hasReadCardAccount: selectHasReadCardAccount(state),
  };
}
