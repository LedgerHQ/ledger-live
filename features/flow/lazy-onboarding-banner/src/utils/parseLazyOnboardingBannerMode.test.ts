import { parseLazyOnboardingBannerMode } from "./parseLazyOnboardingBannerMode";

describe("parseLazyOnboardingBannerMode", () => {
  it.each(["feature_intro", "shop_direct"] as const)(
    "should return %s when the raw value matches",
    mode => {
      expect(parseLazyOnboardingBannerMode(mode)).toBe(mode);
    },
  );

  it.each([undefined, null, "", "unknown", 0, false])(
    "should fall back to shop_direct for invalid raw value %p",
    raw => {
      expect(parseLazyOnboardingBannerMode(raw)).toBe("shop_direct");
    },
  );
});
