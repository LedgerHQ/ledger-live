import { FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT } from "tests/utils/featureFlagUtils";

/** Must stay in sync with `postOnboarding.actionsToComplete` in userdata/post-onboarding-hub-flow.json. */
export const MOCK_ACTIONS = ["claimMock", "personalizeMock", "migrateAssetsMock"] as const;

export const POST_ONBOARDING_FLAGS = {
  ...FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
  onboardingWidget: { enabled: true },
  protectServicesDesktop: { enabled: false },
  lwdProductTour: { enabled: false },
  lldLedgerSyncEntryPoints: { enabled: false },
};

export const POST_ONBOARDING_USERDATA = "post-onboarding-hub-flow";

// i18n `postOnboarding.dialog.actionCompletedLabel`
export const ACTION_COMPLETED_LABEL = "Complete";
