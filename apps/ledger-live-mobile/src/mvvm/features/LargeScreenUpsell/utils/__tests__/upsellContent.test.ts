import { buildLargeScreenUpsellContent } from "../upsellContent";

const t = (key: string, options?: Record<string, unknown>) => {
  if (key === "largeScreenUpsellModal.cta") {
    return "Explore touchscreen signers";
  }

  if (key === "largeScreenUpsellModal.optedIn.title") {
    return `See more. Tap less. Save ${String(options?.discount)}%`;
  }

  if (key === "largeScreenUpsellModal.optedIn.subtitle") {
    return "Enjoy clearer signers and an exclusive offer.";
  }

  if (key === "largeScreenUpsellModal.optedOut.title") {
    return "Spot scams. See every detail";
  }

  if (key === "largeScreenUpsellModal.optedOut.subtitle") {
    return "Review each transaction detail with confidence.";
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

    expect(content.title).toBe("Spot scams. See every detail");
    expect(content.subtitle).toBe("Review each transaction detail with confidence.");
    expect(content.primaryButtonLink).toContain("support.ledger.com/limits");
    expect(content.imageUrlLight).toContain("large_screen_upsell_light");
    expect(content.imageUrlDark).toContain("large_screen_upsell_dark");
  });
});
