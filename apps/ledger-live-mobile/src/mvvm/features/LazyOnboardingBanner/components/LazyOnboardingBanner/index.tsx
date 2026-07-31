import React from "react";
import { LazyOnboardingBannerView } from "./LazyOnboardingBannerView";
import { useLazyOnboardingBannerViewModel } from "./useLazyOnboardingBannerViewModel";

export function LazyOnboardingBanner() {
  return <LazyOnboardingBannerView {...useLazyOnboardingBannerViewModel()} />;
}

export { LazyOnboardingBannerView } from "./LazyOnboardingBannerView";
export type { LazyOnboardingBannerViewProps } from "./types";
export { useLazyOnboardingBannerViewModel } from "./useLazyOnboardingBannerViewModel";
