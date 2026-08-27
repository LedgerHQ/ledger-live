import {
  LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
  LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT,
  LARGE_SCREEN_UPSELL_UTM,
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
      LARGE_SCREEN_UPSELL_UTM.content.app_start_modal,
    );
    const url = new URL(result);

    expect(url.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.mobile,
    );
    expect(url.searchParams.get("utm_medium")).toBe(LARGE_SCREEN_UPSELL_UTM.medium);
    expect(url.searchParams.get("utm_campaign")).toBe(LARGE_SCREEN_UPSELL_UTM.campaign);
    expect(url.searchParams.get("utm_content")).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.app_start_modal,
    );
  });

  it("should use desktop source when requested", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "desktop",
      LARGE_SCREEN_UPSELL_UTM.content.app_start_modal,
    );
    expect(new URL(result).searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
    );
  });

  it("should set the provided utm_content", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "desktop",
      LARGE_SCREEN_UPSELL_UTM.content.backups_cta,
    );
    const url = new URL(result);

    expect(url.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
    );
    expect(url.searchParams.get("utm_medium")).toBe(LARGE_SCREEN_UPSELL_UTM.medium);
    expect(url.searchParams.get("utm_campaign")).toBe(LARGE_SCREEN_UPSELL_UTM.campaign);
    expect(url.searchParams.get("utm_content")).toBe(LARGE_SCREEN_UPSELL_UTM.content.backups_cta);
  });

  it("should support legacy individual constants", () => {
    expect(LARGE_SCREEN_UPSELL_MODAL_UTM_CONTENT).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.app_start_modal,
    );
    expect(LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.backups_cta,
    );
    expect(LARGE_SCREEN_UPSELL_UTM_MEDIUM).toBe(LARGE_SCREEN_UPSELL_UTM.medium);
    expect(LARGE_SCREEN_UPSELL_UTM_CAMPAIGN).toBe(LARGE_SCREEN_UPSELL_UTM.campaign);
    expect(LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM).toBe(
      LARGE_SCREEN_UPSELL_UTM.sourceByPlatform,
    );
  });

  it("should set recover_trigger utm_content", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "desktop",
      LARGE_SCREEN_UPSELL_UTM.content.recover_trigger,
    );
    const url = new URL(result);

    expect(url.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
    );
    expect(url.searchParams.get("utm_medium")).toBe(LARGE_SCREEN_UPSELL_UTM.medium);
    expect(url.searchParams.get("utm_campaign")).toBe(LARGE_SCREEN_UPSELL_UTM.campaign);
    expect(url.searchParams.get("utm_content")).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.recover_trigger,
    );
  });

  it("should set profile_cta utm_content", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "desktop",
      LARGE_SCREEN_UPSELL_UTM.content.profile_cta,
    );
    const url = new URL(result);

    expect(url.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
    );
    expect(url.searchParams.get("utm_medium")).toBe(LARGE_SCREEN_UPSELL_UTM.medium);
    expect(url.searchParams.get("utm_campaign")).toBe(LARGE_SCREEN_UPSELL_UTM.campaign);
    expect(url.searchParams.get("utm_content")).toBe(LARGE_SCREEN_UPSELL_UTM.content.profile_cta);
  });

  it("should set hardware_carousel utm_content", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer",
      "desktop",
      LARGE_SCREEN_UPSELL_UTM.content.hardware_carousel,
    );
    const url = new URL(result);

    expect(url.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
    );
    expect(url.searchParams.get("utm_medium")).toBe(LARGE_SCREEN_UPSELL_UTM.medium);
    expect(url.searchParams.get("utm_campaign")).toBe(LARGE_SCREEN_UPSELL_UTM.campaign);
    expect(url.searchParams.get("utm_content")).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.hardware_carousel,
    );
  });

  it("should preserve existing query params while setting UTM values", () => {
    const result = buildLargeScreenUpsellCtaLink(
      "https://example.com/offer?foo=bar",
      "mobile",
      LARGE_SCREEN_UPSELL_UTM.content.app_start_modal,
    );
    const url = new URL(result);

    expect(url.searchParams.get("foo")).toBe("bar");
    expect(url.searchParams.get("utm_source")).toBe(
      LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.mobile,
    );
  });

  it("should return the trimmed input when URL parsing fails", () => {
    expect(
      buildLargeScreenUpsellCtaLink(
        " not a url ",
        "mobile",
        LARGE_SCREEN_UPSELL_UTM.content.app_start_modal,
      ),
    ).toBe("not a url");
  });
});
