import {
  LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
  LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT,
  buildLargeScreenUpsellCtaLink,
} from "./upsellCta";

describe("buildLargeScreenUpsellCtaLink", () => {
  it("should append expected UTM parameters for mobile", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "mobile",
      LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT,
    );
    const url = new URL(result);

    expect(url.searchParams.get("utm_source")).toBe("ledger_wallet_mobile");
    expect(url.searchParams.get("utm_medium")).toBe("ledger_live");
    expect(url.searchParams.get("utm_campaign")).toBe("nano_upgrade_program");
    expect(url.searchParams.get("utm_content")).toBe("app_start_modal");
  });

  it("should use desktop source when requested", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "desktop",
      LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT,
    );
    expect(new URL(result).searchParams.get("utm_source")).toBe("ledger_wallet_desktop");
  });

  it("should set the provided utm_content", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "desktop",
      LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
    );
    expect(result).toBe(
      "https://example.com/offer?utm_source=ledger_wallet_desktop&utm_medium=ledger_live&utm_campaign=nano_upgrade_program&utm_content=backups_cta",
    );
  });

  it("should preserve existing query params while setting UTM values", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer?foo=bar",
      "mobile",
      LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT,
    );
    const url = new URL(result);

    expect(url.searchParams.get("foo")).toBe("bar");
    expect(url.searchParams.get("utm_source")).toBe("ledger_wallet_mobile");
  });

  it("should return the trimmed input when URL parsing fails", () => {
    expect(
      buildLargeScreenUpsellCtaLink(" not a url ", "mobile", LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT),
    ).toBe("not a url");
  });
});
