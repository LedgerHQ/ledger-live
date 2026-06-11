import {
  countValidCarouselCards,
  countValidFeatureIntroCards,
  getExpectedItemCount,
  getExpectedSlideCount,
  hasReceivedAllCarouselSlides,
  hasReceivedAllFeatureIntroCards,
  parseCampaignCount,
} from "../campaignCompleteness";
import {
  FeatureIntroRole,
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalInputExtras,
} from "../types";

const makeCard = (
  id: string,
  extras: GenericAwarenessModalInputExtras,
): GenericAwarenessModalBrazeCard => ({
  id,
  extras,
});

describe("parseCampaignCount", () => {
  it("should parse positive integer strings and numbers", () => {
    expect(parseCampaignCount("3")).toBe(3);
    expect(parseCampaignCount(2)).toBe(2);
  });

  it("should return undefined for invalid values", () => {
    expect(parseCampaignCount("0")).toBeUndefined();
    expect(parseCampaignCount("-1")).toBeUndefined();
    expect(parseCampaignCount("abc")).toBeUndefined();
    expect(parseCampaignCount(undefined)).toBeUndefined();
  });
});

describe("getExpectedSlideCount", () => {
  it("should return undefined when slideCount is missing on any card", () => {
    const card = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
    });

    expect(getExpectedSlideCount([card])).toBeUndefined();
  });

  it("should return undefined when slideCount differs between cards", () => {
    const firstSlide = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      slideCount: "2",
    });
    const secondSlide = makeCard("2", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "1",
      slideCount: "3",
    });

    expect(getExpectedSlideCount([firstSlide, secondSlide])).toBeUndefined();
  });
});

describe("hasReceivedAllCarouselSlides", () => {
  it("should return undefined when slideCount is missing", () => {
    const card = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
    });

    expect(hasReceivedAllCarouselSlides([card])).toBeUndefined();
  });

  it("should return undefined when slideCount differs between cards", () => {
    const firstSlide = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      slideCount: "2",
    });
    const secondSlide = makeCard("2", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "1",
      slideCount: "3",
    });

    expect(hasReceivedAllCarouselSlides([firstSlide, secondSlide])).toBeUndefined();
  });

  it("should return false until all slides are received", () => {
    const firstSlide = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      slideCount: "2",
    });
    const secondSlide = makeCard("2", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "1",
      slideCount: "2",
    });

    expect(hasReceivedAllCarouselSlides([firstSlide])).toBe(false);
    expect(getExpectedSlideCount([firstSlide])).toBe(2);
    expect(countValidCarouselCards([firstSlide])).toBe(1);
    expect(hasReceivedAllCarouselSlides([firstSlide, secondSlide])).toBe(true);
  });
});

describe("getExpectedItemCount", () => {
  it("should return undefined when itemCount is missing on any card", () => {
    const mainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Main,
    });

    expect(getExpectedItemCount([mainCard])).toBeUndefined();
  });

  it("should return undefined when itemCount differs between cards", () => {
    const mainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Main,
      itemCount: "2",
    });
    const itemCard = makeCard("item", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      index: "0",
      itemCount: "3",
    });

    expect(getExpectedItemCount([mainCard, itemCard])).toBeUndefined();
  });
});

describe("hasReceivedAllFeatureIntroCards", () => {
  it("should return undefined when itemCount is missing", () => {
    const mainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Main,
    });

    expect(hasReceivedAllFeatureIntroCards([mainCard])).toBeUndefined();
  });

  it("should return undefined when itemCount differs between cards", () => {
    const mainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Main,
      itemCount: "2",
    });
    const itemCard = makeCard("item", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      index: "0",
      itemCount: "3",
    });

    expect(hasReceivedAllFeatureIntroCards([mainCard, itemCard])).toBeUndefined();
  });

  it("should return false until all main and item cards are received", () => {
    const mainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Main,
      itemCount: "3",
    });
    const itemCard = makeCard("item", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      index: "0",
      itemCount: "3",
    });
    const secondItemCard = makeCard("item-1", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      index: "1",
      itemCount: "3",
    });

    expect(hasReceivedAllFeatureIntroCards([mainCard])).toBe(false);
    expect(getExpectedItemCount([mainCard])).toBe(3);
    expect(countValidFeatureIntroCards([mainCard, itemCard])).toBe(2);
    expect(hasReceivedAllFeatureIntroCards([mainCard, itemCard, secondItemCard])).toBe(true);
  });
});
