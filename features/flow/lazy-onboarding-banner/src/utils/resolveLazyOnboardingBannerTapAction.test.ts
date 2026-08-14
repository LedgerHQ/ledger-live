import { resolveLazyOnboardingBannerTapAction } from "./resolveLazyOnboardingBannerTapAction";

describe("resolveLazyOnboardingBannerTapAction", () => {
  it("should open the shop in shop_direct mode", () => {
    expect(resolveLazyOnboardingBannerTapAction("shop_direct")).toBe("open_shop");
  });

  it("should open the feature intro tour in feature_intro mode", () => {
    expect(resolveLazyOnboardingBannerTapAction("feature_intro")).toBe("open_feature_intro_tour");
  });
});
