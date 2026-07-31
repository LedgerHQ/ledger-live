import { getLazyOnboardingBannerDecision } from "./getLazyOnboardingBannerDecision";

const eligibleUserState = {
  hasCompletedOnboarding: true,
  isReadOnlyModeEnabled: true,
  onboardingHasDevice: false,
  isReborn: true,
  hasEverConnectedDevice: false,
  isDismissed: false,
} as const;

describe("getLazyOnboardingBannerDecision", () => {
  it("should show the banner to an eligible lazy onboarding user", () => {
    expect(getLazyOnboardingBannerDecision(eligibleUserState, { isFeatureEnabled: true })).toEqual({
      shouldShow: true,
    });
  });

  it.each([
    ["feature_disabled", eligibleUserState, false],
    ["onboarding_incomplete", { ...eligibleUserState, hasCompletedOnboarding: false }, true],
    ["read_only_disabled", { ...eligibleUserState, isReadOnlyModeEnabled: false }, true],
    ["onboarding_device", { ...eligibleUserState, onboardingHasDevice: true }, true],
    ["onboarding_device_unknown", { ...eligibleUserState, onboardingHasDevice: null }, true],
    ["not_reborn", { ...eligibleUserState, isReborn: false }, true],
    ["reborn_unknown", { ...eligibleUserState, isReborn: null }, true],
    ["device_connected", { ...eligibleUserState, hasEverConnectedDevice: true }, true],
    ["dismissed", { ...eligibleUserState, isDismissed: true }, true],
  ] as const)("should return %s when ineligible", (reason, userState, isFeatureEnabled) => {
    expect(getLazyOnboardingBannerDecision(userState, { isFeatureEnabled })).toEqual({
      shouldShow: false,
      reason,
    });
  });
});
