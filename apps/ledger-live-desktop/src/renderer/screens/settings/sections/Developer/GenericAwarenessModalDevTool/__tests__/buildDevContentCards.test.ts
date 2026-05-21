import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  buildDevCarouselCard,
  buildDevFeatureIntroCard,
  isDevGenericAwarenessModalCardId,
  parsePositiveCount,
  removeDevContentCards,
} from "../buildDevContentCards";

describe("buildDevContentCards", () => {
  it("should build a carousel card with templated slides", () => {
    const card = buildDevCarouselCard({
      slideCount: 2,
      primaryButtonLink: "https://example.com/cta",
      isAppStart: false,
      campaignId: "campaign-2",
    });

    expect(card.layout).toBe(GenericAwarenessModalLayout.Carousel);
    expect(card.id).toBe("campaign-2");
    expect(card.data).toHaveLength(2);
    expect(card.data[0]?.title).toBe("Carousel slide 1");
    expect(card.data[0]?.primaryButtonLink).toBe("https://example.com/cta");
  });

  it("should prefix campaign id for APP_START carousel cards", () => {
    const card = buildDevCarouselCard({
      slideCount: 1,
      primaryButtonLink: "https://example.com",
      isAppStart: true,
      campaignId: "my_campaign",
    });

    expect(card.id).toBe("APP_START_my_campaign");
  });

  it("should build a feature intro card with templated items", () => {
    const card = buildDevFeatureIntroCard({
      itemCount: 3,
      primaryButtonLink: "https://example.com/intro",
      isAppStart: true,
    });

    expect(card.layout).toBe(GenericAwarenessModalLayout.FeatureIntro);
    expect(card.id.startsWith("APP_START_")).toBe(true);
    expect(card.items).toHaveLength(3);
    expect(card.primaryButtonLink).toBe("https://example.com/intro");
  });

  it("should clamp parsed counts", () => {
    expect(parsePositiveCount("0", 2)).toBe(2);
    expect(parsePositiveCount("99", 2, 10)).toBe(10);
    expect(parsePositiveCount("4", 2)).toBe(4);
  });

  it("should detect auto-generated dev card ids", () => {
    expect(isDevGenericAwarenessModalCardId("dev-carousel-1")).toBe(true);
    expect(isDevGenericAwarenessModalCardId("APP_START_intro")).toBe(false);
  });

  it("should remove dev cards and restore mock cards from code", () => {
    const devCard = buildDevCarouselCard({
      slideCount: 1,
      primaryButtonLink: "https://example.com",
      isAppStart: false,
      campaignId: "dev-carousel-test",
    });

    const result = removeDevContentCards(
      [{ ...devCard, id: "dev-carousel-test" }],
      new Set(["custom-campaign"]),
    );

    expect(result.some(card => card.id === "dev-carousel-test")).toBe(false);
    expect(result.some(card => card.id === "APP_START_intro")).toBe(true);
    expect(result.some(card => card.id === "1")).toBe(true);
    expect(result.some(card => card.id === "2")).toBe(true);
  });
});
