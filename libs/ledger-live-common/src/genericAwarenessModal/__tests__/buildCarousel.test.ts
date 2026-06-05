import { buildCarousel } from "../buildCarousel";
import {
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

describe("buildCarousel", () => {
  it("should build sorted carousel slides from valid carousel inputs", () => {
    const secondSlideCard = makeCard("2", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "1",
      slideCount: "2",
      title: "Slide 2",
      subtitle: "Second",
      imageUrl: "https://example.com/2.png",
      primaryButtonLabel: "Go",
      primaryButtonLink: "https://example.com/2",
    });
    const firstSlideCard = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      slideCount: "2",
      title: "Slide 1",
      subtitle: "First",
      imageUrl: "https://example.com/1.png",
      primaryButtonLabel: "Start",
      primaryButtonLink: "https://example.com/1",
    });

    const carousel = buildCarousel("campaign-1", [secondSlideCard, firstSlideCard]);

    expect(carousel).toEqual({
      layout: GenericAwarenessModalLayout.Carousel,
      id: "campaign-1",
      isReady: true,
      data: [
        {
          title: "Slide 1",
          subtitle: "First",
          imageUrl: "https://example.com/1.png",
          primaryButtonLabel: "Start",
          primaryButtonLink: "https://example.com/1",
        },
        {
          title: "Slide 2",
          subtitle: "Second",
          imageUrl: "https://example.com/2.png",
          primaryButtonLabel: "Go",
          primaryButtonLink: "https://example.com/2",
        },
      ],
    });
  });

  it("should default missing slide fields to empty strings", () => {
    const cardWithoutSlideFields = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      slideCount: "1",
    });

    const carousel = buildCarousel("campaign-1", [cardWithoutSlideFields]);

    expect(carousel).toBeDefined();
    expect(carousel!.data).toEqual([
      {
        title: "",
        subtitle: "",
        imageUrl: "",
        primaryButtonLabel: "",
        primaryButtonLink: "",
      },
    ]);
  });

  it("should return carousel with isReady false when slideCount is set but not all slides have arrived", () => {
    const firstSlideCard = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      slideCount: "2",
      title: "Slide 1",
    });

    const carousel = buildCarousel("campaign-1", [firstSlideCard]);

    expect(carousel?.isReady).toBe(false);
    expect(carousel?.data).toHaveLength(1);
  });

  it("should build carousel when received slides match slideCount", () => {
    const firstSlideCard = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      slideCount: "2",
      title: "Slide 1",
    });
    const secondSlideCard = makeCard("2", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "1",
      slideCount: "2",
      title: "Slide 2",
    });

    const carousel = buildCarousel("campaign-1", [firstSlideCard, secondSlideCard]);

    expect(carousel?.data).toHaveLength(2);
  });

  it("should skip invalid carousel inputs", () => {
    const missingIndexCard = makeCard("missing-index", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      title: "Ignored",
    });
    const wrongLayoutCard = makeCard("wrong-layout", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      index: "0",
      title: "Ignored",
    });
    const validCard = makeCard("valid", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "1",
      slideCount: "1",
      title: "Valid",
    });

    const carousel = buildCarousel("campaign-1", [missingIndexCard, wrongLayoutCard, validCard]);

    expect(carousel).toBeDefined();
    expect(carousel!.data).toEqual([
      {
        title: "Valid",
        subtitle: "",
        imageUrl: "",
        primaryButtonLabel: "",
        primaryButtonLink: "",
      },
    ]);
  });
});
