import { buildLazyOnboardingBannerLink } from "./buildLazyOnboardingBannerLink";

const DEFAULT_LINK = "https://shop.ledger.com/";

describe("buildLazyOnboardingBannerLink", () => {
  it("should append the mobile lazy onboarding attribution", () => {
    const url = new URL(buildLazyOnboardingBannerLink("https://shop.ledger.com/", "mobile"));

    expect(url.searchParams.get("utm_source")).toBe("ledger_wallet_mobile");
    expect(url.searchParams.get("utm_medium")).toBe("ledger_live");
    expect(url.searchParams.get("utm_campaign")).toBe("upsell_large_screen");
    expect(url.searchParams.get("utm_content")).toBe("lazy_onboarding_banner");
  });

  it("should use the desktop source for Ledger Wallet Desktop", () => {
    const url = new URL(buildLazyOnboardingBannerLink("https://shop.ledger.com/", "desktop"));

    expect(url.searchParams.get("utm_source")).toBe("ledger_wallet_desktop");
    expect(url.searchParams.get("utm_medium")).toBe("ledger_live");
  });

  it("should preserve unrelated parameters and replace existing attribution", () => {
    const url = new URL(
      buildLazyOnboardingBannerLink(
        "https://ledger.com/shop?product=flex&utm_source=old&utm_medium=old",
        "mobile",
      ),
    );

    expect(url.origin + url.pathname).toBe("https://ledger.com/shop");
    expect(url.searchParams.get("product")).toBe("flex");
    expect(url.searchParams.get("utm_source")).toBe("ledger_wallet_mobile");
    expect(url.searchParams.get("utm_medium")).toBe("ledger_live");
  });

  it.each(["", "   "])('should fall back to the default Shop URL for "%s"', link => {
    const url = new URL(buildLazyOnboardingBannerLink(link, "mobile"));

    expect(url.origin + url.pathname).toBe(DEFAULT_LINK);
    expect(url.protocol).toBe("https:");
    expect(url.searchParams.get("utm_content")).toBe("lazy_onboarding_banner");
  });
});
