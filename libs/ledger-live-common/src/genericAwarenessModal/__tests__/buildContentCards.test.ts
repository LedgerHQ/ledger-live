import {
  FeatureIntroRole,
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalInputExtras,
} from "../types";
import {
  buildGenericAwarenessModalContentCards,
  getValidGenericAwarenessModalCards,
  groupByCampaignId,
  hasUniqueLayout,
  processGenericAwarenessModalBrazeCards,
} from "../buildContentCards";

const makeCard = (
  id: string,
  extras: GenericAwarenessModalInputExtras,
): GenericAwarenessModalBrazeCard => ({
  id,
  extras,
});

const makeGroupedCards = (campaignId: string, cards: GenericAwarenessModalBrazeCard[]) =>
  new Map<string, GenericAwarenessModalBrazeCard[]>([[campaignId, cards]]);

describe("groupByCampaignId", () => {
  it("should group cards by extras.campaignId", () => {
    const firstCampaignCard = makeCard("1", { campaignId: "a", layout: "carousel" });
    const otherCampaignCard = makeCard("2", { campaignId: "b", layout: "carousel" });
    const secondCampaignCard = makeCard("3", { campaignId: "a", layout: "carousel" });

    const cardsByCampaignId = groupByCampaignId([
      firstCampaignCard,
      otherCampaignCard,
      secondCampaignCard,
    ]);

    expect(cardsByCampaignId.get("a")?.map(card => card.id)).toEqual(["1", "3"]);
    expect(cardsByCampaignId.get("b")?.map(card => card.id)).toEqual(["2"]);
  });

  it("should skip cards without campaignId", () => {
    const cardWithoutCampaignId = makeCard("1", { layout: "carousel" });
    const cardWithCampaignId = makeCard("2", { campaignId: "a", layout: "carousel" });

    const cardsByCampaignId = groupByCampaignId([cardWithoutCampaignId, cardWithCampaignId]);

    expect(cardsByCampaignId.size).toBe(1);
    expect(cardsByCampaignId.get("a")).toHaveLength(1);
  });
});

describe("hasUniqueLayout", () => {
  it("should return true when all cards share the same layout", () => {
    const firstCarouselCard = makeCard("1", { campaignId: "a", layout: "carousel" });
    const secondCarouselCard = makeCard("2", { campaignId: "a", layout: "carousel" });

    const hasOneLayout = hasUniqueLayout([firstCarouselCard, secondCarouselCard]);

    expect(hasOneLayout).toBe(true);
  });

  it("should return false when cards have mixed layouts", () => {
    const carouselCard = makeCard("1", { campaignId: "a", layout: "carousel" });
    const featureIntroCard = makeCard("2", { campaignId: "a", layout: "featureIntro" });

    const hasOneLayout = hasUniqueLayout([carouselCard, featureIntroCard]);

    expect(hasOneLayout).toBe(false);
  });
});

describe("getValidGenericAwarenessModalCards", () => {
  it("should drop campaigns with mixed layouts", () => {
    const firstValidCard = makeCard("1", { campaignId: "valid", layout: "carousel" });
    const secondValidCard = makeCard("2", { campaignId: "valid", layout: "carousel" });
    const invalidCarouselCard = makeCard("3", { campaignId: "invalid", layout: "carousel" });
    const invalidFeatureIntroCard = makeCard("4", {
      campaignId: "invalid",
      layout: "featureIntro",
    });
    const groupedCards = new Map<string, GenericAwarenessModalBrazeCard[]>([
      ["valid", [firstValidCard, secondValidCard]],
      ["invalid", [invalidCarouselCard, invalidFeatureIntroCard]],
    ]);

    const validCards = getValidGenericAwarenessModalCards(groupedCards);

    expect(Array.from(validCards.keys())).toEqual(["valid"]);
    expect(validCards.get("valid")).toHaveLength(2);
  });
});

describe("buildGenericAwarenessModalContentCards", () => {
  it("should build carousel content from grouped braze card extras", () => {
    const secondSlideCard = makeCard("2", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "1",
      title: "Slide 2",
      subtitle: "Second",
      imageUrl: "https://example.com/2.png",
      primaryButtonLabel: "Go",
      primaryButtonLink: "https://example.com",
    });
    const firstSlideCard = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      title: "Slide 1",
      subtitle: "First",
      imageUrl: "https://example.com/1.png",
      primaryButtonLabel: "Go",
      primaryButtonLink: "https://example.com",
    });
    const groupedCards = makeGroupedCards("campaign-1", [secondSlideCard, firstSlideCard]);

    const contentCards = buildGenericAwarenessModalContentCards(groupedCards);

    expect(contentCards).toEqual([
      {
        layout: GenericAwarenessModalLayout.Carousel,
        id: "campaign-1",
        data: [
          {
            title: "Slide 1",
            subtitle: "First",
            imageUrl: "https://example.com/1.png",
            primaryButtonLabel: "Go",
            primaryButtonLink: "https://example.com",
          },
          {
            title: "Slide 2",
            subtitle: "Second",
            imageUrl: "https://example.com/2.png",
            primaryButtonLabel: "Go",
            primaryButtonLink: "https://example.com",
          },
        ],
      },
    ]);
  });

  it("should build feature intro content from grouped braze card extras", () => {
    const mainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-2",
      role: FeatureIntroRole.Main,
      title: "Main title",
      subtitle: "Main subtitle",
      imageUrl: "https://example.com/hero.png",
      primaryButtonLabel: "Primary",
      primaryButtonLink: "ledgerwallet://primary",
      secondaryButtonLabel: "Secondary",
      secondaryButtonLink: "ledgerwallet://secondary",
    });
    const secondItemCard = makeCard("item-1", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-2",
      role: FeatureIntroRole.Item,
      index: "1",
      icon: "icon-2",
      title: "Item 2",
      subtitle: "Item 2 subtitle",
    });
    const firstItemCard = makeCard("item-0", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-2",
      role: FeatureIntroRole.Item,
      index: "0",
      icon: "icon-1",
      title: "Item 1",
      subtitle: "Item 1 subtitle",
    });
    const groupedCards = makeGroupedCards("campaign-2", [mainCard, secondItemCard, firstItemCard]);

    const contentCards = buildGenericAwarenessModalContentCards(groupedCards);

    expect(contentCards).toEqual([
      {
        layout: GenericAwarenessModalLayout.FeatureIntro,
        id: "campaign-2",
        title: "Main title",
        subtitle: "Main subtitle",
        imageUrl: "https://example.com/hero.png",
        primaryButtonLabel: "Primary",
        primaryButtonLink: "ledgerwallet://primary",
        secondaryButtonLabel: "Secondary",
        secondaryButtonLink: "ledgerwallet://secondary",
        items: [
          { icon: "icon-1", title: "Item 1", subtitle: "Item 1 subtitle" },
          { icon: "icon-2", title: "Item 2", subtitle: "Item 2 subtitle" },
        ],
      },
    ]);
  });

  it("should build prompt content from grouped braze card extras", () => {
    const promptCard = makeCard("prompt", {
      layout: GenericAwarenessModalLayout.Prompt,
      campaignId: "campaign-prompt",
      imageUrl: "https://example.com/prompt.png",
      title: "Prompt title",
      subtitle: "Prompt subtitle",
      primaryButtonLabel: "Primary",
      primaryButtonLink: "ledgerwallet://primary",
      secondaryButtonLabel: "Secondary",
      secondaryButtonLink: "ledgerwallet://secondary",
    });
    const groupedCards = makeGroupedCards("campaign-prompt", [promptCard]);

    const contentCards = buildGenericAwarenessModalContentCards(groupedCards);

    expect(contentCards).toEqual([
      {
        layout: GenericAwarenessModalLayout.Prompt,
        id: "campaign-prompt",
        imageUrl: "https://example.com/prompt.png",
        title: "Prompt title",
        subtitle: "Prompt subtitle",
        primaryButtonLabel: "Primary",
        primaryButtonLink: "ledgerwallet://primary",
        secondaryButtonLabel: "Secondary",
        secondaryButtonLink: "ledgerwallet://secondary",
      },
    ]);
  });

  it("should skip prompt campaigns when braze cards do not parse as prompt inputs", () => {
    const invalidPromptCard = makeCard("invalid", {
      layout: GenericAwarenessModalLayout.Prompt,
      title: "Missing campaignId in extras",
    });
    const groupedCards = makeGroupedCards("campaign-prompt", [invalidPromptCard]);

    const contentCards = buildGenericAwarenessModalContentCards(groupedCards);

    expect(contentCards).toEqual([]);
  });

  it("should skip feature intro campaigns without a main card", () => {
    const itemCard = makeCard("item-0", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-3",
      role: FeatureIntroRole.Item,
      index: "0",
      icon: "icon-1",
      title: "Item 1",
      subtitle: "Item 1 subtitle",
    });
    const groupedCards = makeGroupedCards("campaign-3", [itemCard]);

    const contentCards = buildGenericAwarenessModalContentCards(groupedCards);

    expect(contentCards).toEqual([]);
  });

  it("should build prompt content from grouped braze card extras", () => {
    const promptCard = makeCard("prompt", {
      layout: GenericAwarenessModalLayout.Prompt,
      campaignId: "campaign-prompt",
      title: "Prompt title",
      subtitle: "Prompt subtitle",
      imageUrl: "https://example.com/prompt.png",
      primaryButtonLabel: "Learn more",
      primaryButtonLink: "https://example.com",
    });
    const groupedCards = makeGroupedCards("campaign-prompt", [promptCard]);

    const contentCards = buildGenericAwarenessModalContentCards(groupedCards);

    expect(contentCards).toEqual([
      {
        layout: GenericAwarenessModalLayout.Prompt,
        id: "campaign-prompt",
        title: "Prompt title",
        subtitle: "Prompt subtitle",
        imageUrl: "https://example.com/prompt.png",
        primaryButtonLabel: "Learn more",
        primaryButtonLink: "https://example.com",
        secondaryButtonLabel: "",
        secondaryButtonLink: "",
      },
    ]);
  });

  it("should ignore campaigns with unknown layout", () => {
    const unknownLayoutCard = makeCard("1", {
      layout: "unknown",
      campaignId: "campaign-unknown",
      title: "Ignored",
    });
    const groupedCards = makeGroupedCards("campaign-unknown", [unknownLayoutCard]);

    const contentCards = buildGenericAwarenessModalContentCards(groupedCards);

    expect(contentCards).toEqual([]);
  });

  it("should default missing carousel extras to empty strings", () => {
    const cardWithoutSlideFields = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
    });
    const groupedCards = makeGroupedCards("campaign-1", [cardWithoutSlideFields]);

    const contentCards = buildGenericAwarenessModalContentCards(groupedCards);

    expect(contentCards).toEqual([
      {
        layout: GenericAwarenessModalLayout.Carousel,
        id: "campaign-1",
        data: [
          {
            title: "",
            subtitle: "",
            imageUrl: "",
            primaryButtonLabel: "",
            primaryButtonLink: "",
          },
        ],
      },
    ]);
  });
});

describe("processGenericAwarenessModalBrazeCards", () => {
  it("should group, validate and build content cards", () => {
    const carouselCard = makeCard("1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-1",
      index: "0",
      title: "Slide 1",
      subtitle: "First",
      imageUrl: "https://example.com/1.png",
      primaryButtonLabel: "Go",
      primaryButtonLink: "https://example.com",
    });
    const invalidCarouselCard = makeCard("2", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "invalid",
      index: "0",
      title: "Bad",
      subtitle: "Bad",
      imageUrl: "",
      primaryButtonLabel: "",
      primaryButtonLink: "",
    });
    const invalidFeatureIntroCard = makeCard("3", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "invalid",
      role: FeatureIntroRole.Item,
      index: "0",
      icon: "",
      title: "",
      subtitle: "",
    });

    const contentCards = processGenericAwarenessModalBrazeCards([
      carouselCard,
      invalidCarouselCard,
      invalidFeatureIntroCard,
    ]);

    expect(contentCards).toEqual([
      {
        layout: GenericAwarenessModalLayout.Carousel,
        id: "campaign-1",
        data: [
          {
            title: "Slide 1",
            subtitle: "First",
            imageUrl: "https://example.com/1.png",
            primaryButtonLabel: "Go",
            primaryButtonLink: "https://example.com",
          },
        ],
      },
    ]);
  });

  it("should build multiple valid campaigns", () => {
    const carouselCard = makeCard("carousel-1", {
      layout: GenericAwarenessModalLayout.Carousel,
      campaignId: "campaign-carousel",
      index: "0",
      title: "Slide",
      subtitle: "Subtitle",
      imageUrl: "https://example.com/slide.png",
      primaryButtonLabel: "Go",
      primaryButtonLink: "https://example.com",
    });
    const featureIntroMainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-feature-intro",
      role: FeatureIntroRole.Main,
      title: "Main",
      subtitle: "Main subtitle",
      imageUrl: "https://example.com/hero.png",
      primaryButtonLabel: "Primary",
      primaryButtonLink: "ledgerwallet://primary",
      secondaryButtonLabel: "Secondary",
      secondaryButtonLink: "ledgerwallet://secondary",
    });
    const promptCard = makeCard("prompt", {
      layout: GenericAwarenessModalLayout.Prompt,
      campaignId: "campaign-prompt",
      title: "Prompt",
      subtitle: "Prompt subtitle",
      imageUrl: "https://example.com/prompt.png",
      primaryButtonLabel: "Primary",
      primaryButtonLink: "ledgerwallet://primary",
      secondaryButtonLabel: "Secondary",
      secondaryButtonLink: "ledgerwallet://secondary",
    });

    const contentCards = processGenericAwarenessModalBrazeCards([
      carouselCard,
      featureIntroMainCard,
      promptCard,
    ]);

    expect(contentCards).toHaveLength(3);
    expect(contentCards.map(card => card.id)).toEqual([
      "campaign-carousel",
      "campaign-feature-intro",
      "campaign-prompt",
    ]);
    expect(contentCards[0]?.layout).toBe(GenericAwarenessModalLayout.Carousel);
    expect(contentCards[1]?.layout).toBe(GenericAwarenessModalLayout.FeatureIntro);
    expect(contentCards[2]?.layout).toBe(GenericAwarenessModalLayout.Prompt);
  });

  it("should group cards by campaignId case-insensitively and preserve the first card casing", () => {
    const firstCampaignCard = makeCard("1", { campaignId: "Campaign-A", layout: "carousel", index: "0" });
    const secondCampaignCard = makeCard("2", { campaignId: "campaign-a", layout: "CAROUSEL", index: "1" });
    const otherCampaignCard = makeCard("3", { campaignId: "Other", layout: "carousel", index: "0" });

    const groupedCards = groupByCampaignId([
      firstCampaignCard,
      secondCampaignCard,
      otherCampaignCard,
    ]);

    expect(groupedCards.size).toBe(2);
    expect(groupedCards.get("Campaign-A")).toEqual([firstCampaignCard, secondCampaignCard]);
    expect(groupedCards.get("Other")).toEqual([otherCampaignCard]);
  });

  it("should preserve the first card campaignId casing in built content cards", () => {
    const firstCard = makeCard("1", {
      campaignId: "Campaign-A",
      layout: "carousel",
      index: "0",
      title: "Slide 1",
    });
    const secondCard = makeCard("2", {
      campaignId: "campaign-a",
      layout: "CAROUSEL",
      index: "1",
      title: "Slide 2",
    });

    const contentCards = processGenericAwarenessModalBrazeCards([firstCard, secondCard]);

    expect(contentCards).toHaveLength(1);
    expect(contentCards[0]).toEqual({
      layout: GenericAwarenessModalLayout.Carousel,
      id: "Campaign-A",
      data: [
        expect.objectContaining({ title: "Slide 1" }),
        expect.objectContaining({ title: "Slide 2" }),
      ],
    });
  });

  it("should accept case-insensitive layout, location, and role extras", () => {
    const carouselCard = makeCard("carousel-1", {
      layout: "CAROUSEL",
      campaignId: "campaign-carousel",
      location: "GENERIC_AWARENESS_MODAL",
      index: "0",
      title: "Slide 1",
    });
    const carouselCardTwo = makeCard("carousel-2", {
      layout: "carousel",
      campaignId: "campaign-carousel",
      location: "generic_awareness_modal",
      index: "1",
      title: "Slide 2",
    });
    const featureIntroMainCard = makeCard("feature-intro-main", {
      layout: "FEATUREINTRO",
      campaignId: "campaign-feature-intro",
      location: "Generic_Awareness_Modal",
      role: "MAIN",
      title: "Main title",
      subtitle: "Main subtitle",
    });
    const featureIntroItemCard = makeCard("feature-intro-item", {
      layout: "featureIntro",
      campaignId: "campaign-feature-intro",
      location: "generic_awareness_modal",
      role: "item",
      index: "0",
      icon: "icon",
      title: "Item title",
      subtitle: "Item subtitle",
    });
    const promptCard = makeCard("prompt", {
      layout: "PROMPT",
      campaignId: "campaign-prompt",
      location: "GENERIC_AWARENESS_MODAL",
      title: "Prompt title",
      subtitle: "Prompt subtitle",
    });

    const contentCards = processGenericAwarenessModalBrazeCards([
      carouselCard,
      carouselCardTwo,
      featureIntroMainCard,
      featureIntroItemCard,
      promptCard,
    ]);

    expect(contentCards).toHaveLength(3);
    expect(contentCards[0]?.layout).toBe(GenericAwarenessModalLayout.Carousel);
    expect(contentCards[1]?.layout).toBe(GenericAwarenessModalLayout.FeatureIntro);
    expect(contentCards[2]?.layout).toBe(GenericAwarenessModalLayout.Prompt);
  });

  it("should reject campaigns with mixed layouts regardless of casing", () => {
    const carouselCard = makeCard("1", { campaignId: "mixed", layout: "CAROUSEL", index: "0" });
    const promptCard = makeCard("2", { campaignId: "mixed", layout: "prompt" });

    const contentCards = processGenericAwarenessModalBrazeCards([carouselCard, promptCard]);

    expect(contentCards).toEqual([]);
  });

  it("should trim whitespace from braze string fields when building content cards", () => {
    const promptCard = makeCard("prompt", {
      layout: ` ${GenericAwarenessModalLayout.Prompt} `,
      campaignId: " campaign-prompt ",
      title: "  Prompt title  ",
      subtitle: "  Prompt subtitle  ",
      imageUrl: "  https://example.com/prompt.png  ",
      primaryButtonLabel: "  Primary  ",
      primaryButtonLink: "  ledgerwallet://primary  ",
      secondaryButtonLabel: "  Secondary  ",
      secondaryButtonLink: "  ledgerwallet://secondary  ",
    });

    const contentCards = processGenericAwarenessModalBrazeCards([promptCard]);

    expect(contentCards).toEqual([
      {
        layout: GenericAwarenessModalLayout.Prompt,
        id: "campaign-prompt",
        title: "Prompt title",
        subtitle: "Prompt subtitle",
        imageUrl: "https://example.com/prompt.png",
        primaryButtonLabel: "Primary",
        primaryButtonLink: "ledgerwallet://primary",
        secondaryButtonLabel: "Secondary",
        secondaryButtonLink: "ledgerwallet://secondary",
      },
    ]);
  });
});
