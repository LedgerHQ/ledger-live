import { withFlagOverrides } from "@tests/test-renderer";
import { State } from "~/reducers/types";

const DEFAULT_POLICY_VERSION = 1;

export type ConsentDrawerTestOptions = {
  hasCompletedOnboarding?: boolean;
  analyticsOptInEnabled?: boolean;
  consentDate?: string | null;
  privacyPolicyVersion?: number | null;
  analyticsEnabled?: boolean;
  personalizedRecommendationsEnabled?: boolean;
  analyticsOptInParams?: Partial<{ policyVersion: number; consentValidityDays: number }>;
};

/**
 * Drawer opens on **consentFresh**: consent renewal needed first, analytics off (`needsRenewal`
 * before privacy in the hook). Use for tests that tap fresh CTAs without extra boilerplate.
 */
export function withConsentDrawerOpeningFresh(options: ConsentDrawerTestOptions = {}) {
  return withConsentDrawerState({
    consentDate: null,
    privacyPolicyVersion: DEFAULT_POLICY_VERSION,
    analyticsEnabled: false,
    personalizedRecommendationsEnabled: false,
    ...options,
  });
}

/**
 * Redux preloaded state for analytics consent drawer tests.
 */

export function withConsentDrawerState(options: ConsentDrawerTestOptions = {}) {
  const {
    hasCompletedOnboarding = true,
    analyticsOptInEnabled = true,
    consentDate = null,
    privacyPolicyVersion = DEFAULT_POLICY_VERSION,
    analyticsEnabled = true,
    personalizedRecommendationsEnabled = true,
    analyticsOptInParams = {},
  } = options;

  return (state: State): State =>
    withFlagOverrides({
      analyticsOptIn: {
        enabled: analyticsOptInEnabled,
        params: {
          policyVersion: DEFAULT_POLICY_VERSION,
          consentValidityDays: 365,
          ...analyticsOptInParams,
        },
      },
    })({
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
      },
    });
}
