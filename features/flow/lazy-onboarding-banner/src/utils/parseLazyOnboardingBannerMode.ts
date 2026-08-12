import type { LazyOnboardingBannerMode } from "../types";

export function parseLazyOnboardingBannerMode(raw: unknown): LazyOnboardingBannerMode {
  return raw === "feature_intro" ? "feature_intro" : "shop_direct";
}
