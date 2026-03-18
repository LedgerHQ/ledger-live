type OnboardingSyncFlow = { seedConfiguration: string } | null;

export function getOnboardingStatusAttributes(
  postOnboardingInProgress: boolean,
  isOnboardingFlow: boolean,
  onboardingSyncFlow: OnboardingSyncFlow,
  readOnlyMode: boolean,
  hasCompletedOnboarding: boolean,
): { onboarding_status?: string; seedConfiguration?: string } {
  if (isOnboardingFlow) return { onboarding_status: "Onboarding", ...(onboardingSyncFlow ?? {}) };
  if (postOnboardingInProgress) return { onboarding_status: "post-onboarding" };
  if (readOnlyMode && hasCompletedOnboarding) return { onboarding_status: "lazy_onboarding" };
  return {};
}
