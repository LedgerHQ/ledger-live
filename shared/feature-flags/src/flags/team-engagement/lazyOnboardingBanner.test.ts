import { lazyOnboardingBanner } from "./lazyOnboardingBanner";

describe("lazyOnboardingBanner", () => {
  it("should default to the disabled shop direct mode", () => {
    expect(lazyOnboardingBanner.parse(undefined)).toEqual({
      enabled: false,
      params: { mode: "shop_direct" },
    });
  });

  it.each(["shop_direct", "feature_intro"] as const)("should accept the %s mode", mode => {
    expect(lazyOnboardingBanner.parse({ enabled: true, params: { mode } })).toEqual({
      enabled: true,
      params: { mode },
    });
  });

  it("should reject an unsupported mode", () => {
    expect(() =>
      lazyOnboardingBanner.parse({
        enabled: true,
        params: { mode: "unsupported" },
      }),
    ).toThrow();
  });
});
