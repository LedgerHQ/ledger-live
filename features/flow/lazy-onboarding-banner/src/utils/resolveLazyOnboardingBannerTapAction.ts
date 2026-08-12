import type { LazyOnboardingBannerMode, LazyOnboardingBannerTapAction } from "../types";

export function resolveLazyOnboardingBannerTapAction(
  mode: LazyOnboardingBannerMode,
): LazyOnboardingBannerTapAction {
  return mode === "feature_intro" ? "open_feature_intro_tour" : "open_shop";
}
