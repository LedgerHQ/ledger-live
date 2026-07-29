import { buildLargeScreenUpsellContent } from "../upsellContent";

const t = (key: string, options?: Record<string, unknown>) => {
  if (key === "largeScreenUpsellModal.optedIn.cta") {
    return "Explore touchscreen signers";
  }

  if (key === "largeScreenUpsellModal.optedOut.cta") {
    return "Learn more";
  }

  if (key === "largeScreenUpsellModal.optedIn.title") {
    return `See more. Tap less. Save ${String(options?.discount)}%`;
  }

  if (key === "largeScreenUpsellModal.optedIn.subtitle") {
    return "Enjoy clearer signers and an exclusive offer.";
  }

  if (key === "largeScreenUpsellModal.optedOut.title") {
    return "Spot scams before signing";
  }

  if (key === "largeScreenUpsellModal.optedOut.subtitle") {
    return "Learn more about advanced security features that enable real-time threat detection.";
  }

  return key;
};

describe("buildLargeScreenUpsellContent", () => {
  it("should build opted-in content with rounded discount and UTM link", () => {
    const content = buildLargeScreenUpsellContent({
      id: "upsell",
      variant: "opted_in",
      discount: 0.2,
      optedInLink: "https://shop.ledger.com/upgrade",
      optedOutLink: "https://support.ledger.com/limits",
      t,
    });

    expect(content.title).toBe("See more. Tap less. Save 20%");
    expect(content.subtitle).toBe("Enjoy clearer signers and an exclusive offer.");
    expect(content.primaryButtonLabel).toBe("Explore touchscreen signers");
    expect(content.primaryButtonLink).toContain("utm_campaign=nano_upgrade_program");
    expect(content.imageUrlLight).toContain("large_screen_upsell_light");
    expect(content.imageUrlDark).toContain("large_screen_upsell_dark");
    expect(content.secondaryButtonLabel).toBe("");
    expect(content.items).toEqual([]);
  });

  it("should build opted-out content with the opted-out link", () => {
    const content = buildLargeScreenUpsellContent({
      id: "upsell",
      variant: "opted_out",
      discount: 0.153,
      optedInLink: "https://shop.ledger.com/upgrade",
      optedOutLink: "https://support.ledger.com/limits",
      t,
    });

    expect(content.title).toBe("Spot scams before signing");
    expect(content.subtitle).toBe(
      "Learn more about advanced security features that enable real-time threat detection.",
    );
    expect(content.primaryButtonLabel).toBe("Learn more");
    expect(content.primaryButtonLink).toContain("support.ledger.com/limits");
    expect(content.imageUrlLight).toContain("large_screen_upsell_light");
    expect(content.imageUrlDark).toContain("large_screen_upsell_dark");
  });
});
