import { buildLargeScreenUpsellCtaLink } from "../upsellCta";

describe("buildLargeScreenUpsellCtaLink", () => {
  it("should append expected UTM parameters with default values", () => {
    const result = buildLargeScreenUpsellCtaLink("https://example.com/offer");
    const url = new URL(result);

    expect(url.searchParams.get("utm_source")).toBe("ledger_wallet_mobile");
    expect(url.searchParams.get("utm_medium")).toBe("in_app_placements");
    expect(url.searchParams.get("utm_campaign")).toBe("nano_upgrade_program");
    expect(url.searchParams.get("utm_content")).toBe("app_start_modal");
  });

  it("should support custom platform parameter", () => {
    const result = buildLargeScreenUpsellCtaLink("https://example.com/offer", "desktop");
    const url = new URL(result);

    expect(url.searchParams.get("utm_source")).toBe("ledger_wallet_desktop");
    expect(url.searchParams.get("utm_medium")).toBe("in_app_placements");
  });

  it("should support custom utm_content parameter", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "mobile",
      "portfolio_banner",
    );
    const url = new URL(result);

    expect(url.searchParams.get("utm_content")).toBe("portfolio_banner");
  });

  it("should preserve existing query params while setting UTM values", () => {
    const result = buildLargeScreenUpsellCtaLink("https://example.com/offer?foo=bar");
    const url = new URL(result);

    expect(url.searchParams.get("foo")).toBe("bar");
    expect(url.searchParams.get("utm_source")).toBe("ledger_wallet_mobile");
  });

  it("should return the trimmed input when URL parsing fails", () => {
    expect(buildLargeScreenUpsellCtaLink(" not a url ")).toBe("not a url");
  });
});
