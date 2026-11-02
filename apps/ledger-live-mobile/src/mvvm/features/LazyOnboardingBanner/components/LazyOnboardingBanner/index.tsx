import React from "react";
import { LazyOnboardingBannerView } from "@features/flow-lazy-onboarding-banner/native";
import { useLazyOnboardingBannerViewModel } from "./useLazyOnboardingBannerViewModel";

export function LazyOnboardingBanner() {
  return <LazyOnboardingBannerView {...useLazyOnboardingBannerViewModel()} />;
}

export { useLazyOnboardingBannerViewModel } from "./useLazyOnboardingBannerViewModel";
