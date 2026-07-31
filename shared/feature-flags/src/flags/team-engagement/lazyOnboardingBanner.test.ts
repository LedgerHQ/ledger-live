import { lazyOnboardingBanner } from "./lazyOnboardingBanner";

const DEFAULT_LINK = "https://shop.ledger.com/";

describe("lazyOnboardingBanner", () => {
  it("should default to the disabled shop direct mode", () => {
    expect(lazyOnboardingBanner.parse(undefined)).toEqual({
      enabled: false,
      params: { mode: "shop_direct", link: DEFAULT_LINK },
    });
  });

  it.each(["shop_direct", "feature_intro"] as const)("should accept the %s mode", mode => {
    expect(lazyOnboardingBanner.parse({ enabled: true, params: { mode } })).toEqual({
      enabled: true,
      params: { mode, link: DEFAULT_LINK },
    });
  });

  it("should accept a custom HTTPS shop link on another domain", () => {
    const link = "https://ledger.com/pages/hardware-wallets-comparison";

    expect(
      lazyOnboardingBanner.parse({ enabled: true, params: { mode: "shop_direct", link } }),
    ).toEqual({
      enabled: true,
      params: { mode: "shop_direct", link },
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

  it.each(["", "   ", "not a url", "http://shop.ledger.com/", "javascript:alert(1)"])(
    "should reject the invalid HTTPS link %p",
    link => {
      expect(() =>
        lazyOnboardingBanner.parse({ enabled: true, params: { mode: "shop_direct", link } }),
      ).toThrow();
    },
  );
});
