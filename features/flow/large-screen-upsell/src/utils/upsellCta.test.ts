import {
  LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
  LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT,
  LARGE_SCREEN_UPSELL_UTM_CAMPAIGN,
  LARGE_SCREEN_UPSELL_UTM_MEDIUM,
  LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM,
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

    expect(url.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM.mobile,
    );
    expect(url.searchParams.get("utm_medium")).toBe(LARGE_SCREEN_UPSELL_UTM_MEDIUM);
    expect(url.searchParams.get("utm_campaign")).toBe(LARGE_SCREEN_UPSELL_UTM_CAMPAIGN);
    expect(url.searchParams.get("utm_content")).toBe(LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT);
  });

  it("should use desktop source when requested", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "desktop",
      LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT,
    );
    expect(new URL(result).searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM.desktop,
    );
  });

  it("should set the provided utm_content", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "desktop",
      LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
    );
    const url = new URL(result);

    expect(url.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM.desktop,
    );
    expect(url.searchParams.get("utm_medium")).toBe(LARGE_SCREEN_UPSELL_UTM_MEDIUM);
    expect(url.searchParams.get("utm_campaign")).toBe(LARGE_SCREEN_UPSELL_UTM_CAMPAIGN);
    expect(url.searchParams.get("utm_content")).toBe(LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT);
  });

  it("should preserve existing query params while setting UTM values", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer?foo=bar",
      "mobile",
      LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT,
    );
    const url = new URL(result);

    expect(url.searchParams.get("foo")).toBe("bar");
    expect(url.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM.mobile,
    );
  });

  it("should return the trimmed input when URL parsing fails", () => {
    expect(
      buildLargeScreenUpsellCtaLink(" not a url ", "mobile", LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT),
    ).toBe("not a url");
  });
});
