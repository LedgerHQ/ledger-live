import type { LazyOnboardingBannerMode } from "@features/flow-lazy-onboarding-banner";

export const LAZY_ONBOARDING_BANNER_PAGE = "banner lazy onboarding upgrade";

export const LAZY_ONBOARDING_BANNER_PAGE_NAME = "banner lazy onboarding upgrade";

export const LAZY_ONBOARDING_BANNER_BUTTON = "upgrade to touchscreen";

export const LAZY_ONBOARDING_FEATURE_INTRO_PAGE = "Feature intro";

export const LAZY_ONBOARDING_FEATURE_INTRO_PAGE_NAME = "Feature intro";

export const LAZY_ONBOARDING_SOURCE_FLOW = "lazy onboarding";

export type LazyOnboardingAbBannerFlow = "feature intro" | "shop direct";

export type LazyOnboardingSharedAnalyticsProps = Readonly<{
  hasConnectedDevice: false;
  abLazyBannerFlow: LazyOnboardingAbBannerFlow;
  deviceModel: "none";
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "lwm";
}>;

export function toAbLazyBannerFlow(mode: LazyOnboardingBannerMode): LazyOnboardingAbBannerFlow {
  return mode === "feature_intro" ? "feature intro" : "shop direct";
}

export function buildLazyOnboardingSharedAnalyticsProps(
  mode: LazyOnboardingBannerMode,
  personalRecoOptIn: boolean,
): LazyOnboardingSharedAnalyticsProps {
  return {
    hasConnectedDevice: false,
    abLazyBannerFlow: toAbLazyBannerFlow(mode),
    deviceModel: "none",
    personalRecoOptIn,
    offerType: personalRecoOptIn ? "discount" : "none",
    platform: "lwm",
  };
}
