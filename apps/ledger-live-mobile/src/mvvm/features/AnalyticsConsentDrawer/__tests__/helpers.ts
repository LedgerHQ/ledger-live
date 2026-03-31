import { State } from "~/reducers/types";

export type ConsentDrawerTestOptions = {
  hasCompletedOnboarding?: boolean;
  analyticsOptInEnabled?: boolean;
  consentDate?: string | null;
  privacyPolicyVersion?: number | null;
  analyticsEnabled?: boolean;
  personalizedRecommendationsEnabled?: boolean;
};

/**
 * Redux preloaded state for analytics consent drawer tests.
 * Feature flag `analyticsOptIn` is bridged from `settings.overriddenFeatureFlags` by test-renderer createStore.
 */
export function withConsentDrawerState(options: ConsentDrawerTestOptions = {}) {
  const {
    hasCompletedOnboarding = true,
    analyticsOptInEnabled = true,
    consentDate = null,
    privacyPolicyVersion = null,
    analyticsEnabled = false,
    personalizedRecommendationsEnabled = false,
  } = options;

  return (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      hasCompletedOnboarding,
      analyticsEnabled,
      personalizedRecommendationsEnabled,
      analyticsConsentInfo: {
        consentDate,
        privacyPolicyVersion,
      },
      overriddenFeatureFlags: {
        ...state.settings.overriddenFeatureFlags,
        analyticsOptIn: { enabled: analyticsOptInEnabled },
      },
    },
  });
}
