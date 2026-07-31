import type {
  LazyOnboardingBannerContext,
  LazyOnboardingBannerDecision,
  LazyOnboardingBannerUserState,
} from "../types";

export function getLazyOnboardingBannerDecision(
  userState: LazyOnboardingBannerUserState,
  context: LazyOnboardingBannerContext,
): LazyOnboardingBannerDecision {
  if (!context.isFeatureEnabled) return { shouldShow: false, reason: "feature_disabled" };
  if (!userState.hasCompletedOnboarding)
    return { shouldShow: false, reason: "onboarding_incomplete" };
  if (!userState.isReadOnlyModeEnabled) return { shouldShow: false, reason: "read_only_disabled" };
  if (userState.onboardingHasDevice === true)
    return { shouldShow: false, reason: "onboarding_device" };
  if (userState.onboardingHasDevice === null)
    return { shouldShow: false, reason: "onboarding_device_unknown" };
  if (userState.isReborn === false) return { shouldShow: false, reason: "not_reborn" };
  if (userState.isReborn === null) return { shouldShow: false, reason: "reborn_unknown" };
  if (userState.hasEverConnectedDevice) return { shouldShow: false, reason: "device_connected" };
  if (userState.isDismissed) return { shouldShow: false, reason: "dismissed" };

  return { shouldShow: true };
}
