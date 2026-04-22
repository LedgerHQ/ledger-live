import { withFlagOverrides } from "@tests/test-renderer";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
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
 * Drawer opens on **consentFresh**: consent renewal needed first, analytics off (`needsRenewal`
 * before privacy in the hook). Use for tests that tap fresh CTAs without extra boilerplate.
 */
export function withConsentDrawerOpeningFresh(options: ConsentDrawerTestOptions = {}) {
  return withConsentDrawerState({
    consentDate: null,
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
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
    privacyPolicyVersion = CURRENT_PRIVACY_POLICY_VERSION,
    analyticsEnabled = true,
    personalizedRecommendationsEnabled = true,
  } = options;

  return (state: State): State =>
    withFlagOverrides({ analyticsOptIn: { enabled: analyticsOptInEnabled } })({
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
