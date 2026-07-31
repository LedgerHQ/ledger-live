export type LazyOnboardingBannerUserState = Readonly<{
  hasCompletedOnboarding: boolean;
  isReadOnlyModeEnabled: boolean;
  onboardingHasDevice: boolean | null;
  isReborn: boolean | null;
  hasEverConnectedDevice: boolean;
  isDismissed: boolean;
}>;

export type LazyOnboardingBannerContext = Readonly<{
  isFeatureEnabled: boolean;
}>;

export type LazyOnboardingBannerHiddenReason =
  | "feature_disabled"
  | "onboarding_incomplete"
  | "read_only_disabled"
  | "onboarding_device"
  | "onboarding_device_unknown"
  | "not_reborn"
  | "reborn_unknown"
  | "device_connected"
  | "dismissed";

export type LazyOnboardingBannerDecision =
  | Readonly<{ shouldShow: true }>
  | Readonly<{ shouldShow: false; reason: LazyOnboardingBannerHiddenReason }>;
