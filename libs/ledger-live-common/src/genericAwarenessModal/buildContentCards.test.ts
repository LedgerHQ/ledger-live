import { FeatureIntroRole, GenericAwarenessModalLayout } from "./types";
import {
  buildGenericAwarenessModalContentCards,
  getValidGenericAwarenessModalCards,
  groupByCampaignId,
  hasUniqueLayout,
  processGenericAwarenessModalBrazeCards,
  type GenericAwarenessModalBrazeCard,
} from "./buildContentCards";

const makeCard = (id: string, extras: Record<string, string>): GenericAwarenessModalBrazeCard => ({
  id,
  extras,
});

describe("groupByCampaignId", () => {
  it("should group cards by extras.campaignId", () => {
    const grouped = groupByCampaignId([
      makeCard("1", { campaignId: "a", layout: "carousel" }),
      makeCard("2", { campaignId: "b", layout: "carousel" }),
      makeCard("3", { campaignId: "a", layout: "carousel" }),
    ]);

    expect(grouped.get("a")?.map(card => card.id)).toEqual(["1", "3"]);
    expect(grouped.get("b")?.map(card => card.id)).toEqual(["2"]);
  });

  it("should skip cards without campaignId", () => {
    const grouped = groupByCampaignId([
      makeCard("1", { layout: "carousel" }),
      makeCard("2", { campaignId: "a", layout: "carousel" }),
    ]);

    expect(grouped.size).toBe(1);
    expect(grouped.get("a")).toHaveLength(1);
  });
});

describe("hasUniqueLayout", () => {
  it("should return true when all cards share the same layout", () => {
    expect(
      hasUniqueLayout([
        makeCard("1", { campaignId: "a", layout: "carousel" }),
        makeCard("2", { campaignId: "a", layout: "carousel" }),
      ]),
    ).toBe(true);
  });

  it("should return false when cards have mixed layouts", () => {
    expect(
      hasUniqueLayout([
        makeCard("1", { campaignId: "a", layout: "carousel" }),
        makeCard("2", { campaignId: "a", layout: "featureIntro" }),
      ]),
    ).toBe(false);
  });
});

describe("getValidGenericAwarenessModalCards", () => {
  it("should drop campaigns with mixed layouts", () => {
    const grouped = new Map([
      [
        "valid",
        [
          makeCard("1", { campaignId: "valid", layout: "carousel" }),
          makeCard("2", { campaignId: "valid", layout: "carousel" }),
        ],
      ],
      [
        "invalid",
        [
          makeCard("3", { campaignId: "invalid", layout: "carousel" }),
          makeCard("4", { campaignId: "invalid", layout: "featureIntro" }),
        ],
      ],
    ]);

    const valid = getValidGenericAwarenessModalCards(grouped);

    expect(Array.from(valid.keys())).toEqual(["valid"]);
    expect(valid.get("valid")).toHaveLength(2);
  });
});

describe("buildGenericAwarenessModalContentCards", () => {
  it("should build carousel content from grouped braze card extras", () => {
    const grouped = new Map<string, GenericAwarenessModalBrazeCard[]>([
      [
        "campaign-1",
        [
          makeCard("2", {
            layout: GenericAwarenessModalLayout.Carousel,
            campaignId: "campaign-1",
            index: "1",
            title: "Slide 2",
            subtitle: "Second",
            imageUrl: "https://example.com/2.png",
            primaryButtonLabel: "Go",
            primaryButtonLink: "https://example.com",
          }),
          makeCard("1", {
            layout: GenericAwarenessModalLayout.Carousel,
            campaignId: "campaign-1",
            index: "0",
            title: "Slide 1",
            subtitle: "First",
            imageUrl: "https://example.com/1.png",
            primaryButtonLabel: "Go",
            primaryButtonLink: "https://example.com",
          }),
        ],
      ],
    ]);

    expect(buildGenericAwarenessModalContentCards(grouped)).toEqual([
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
    const grouped = new Map<string, GenericAwarenessModalBrazeCard[]>([
      [
        "campaign-2",
        [
          makeCard("main", {
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
          }),
          makeCard("item-1", {
            layout: GenericAwarenessModalLayout.FeatureIntro,
            campaignId: "campaign-2",
            role: FeatureIntroRole.Item,
            index: "1",
            icon: "icon-2",
            title: "Item 2",
            subtitle: "Item 2 subtitle",
          }),
          makeCard("item-0", {
            layout: GenericAwarenessModalLayout.FeatureIntro,
            campaignId: "campaign-2",
            role: FeatureIntroRole.Item,
            index: "0",
            icon: "icon-1",
            title: "Item 1",
            subtitle: "Item 1 subtitle",
          }),
        ],
      ],
    ]);

    expect(buildGenericAwarenessModalContentCards(grouped)).toEqual([
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

  it("should skip feature intro campaigns without a main card", () => {
    const grouped = new Map<string, GenericAwarenessModalBrazeCard[]>([
      [
        "campaign-3",
        [
          makeCard("item-0", {
            layout: GenericAwarenessModalLayout.FeatureIntro,
            campaignId: "campaign-3",
            role: FeatureIntroRole.Item,
            index: "0",
            icon: "icon-1",
            title: "Item 1",
            subtitle: "Item 1 subtitle",
          }),
        ],
      ],
    ]);

    expect(buildGenericAwarenessModalContentCards(grouped)).toEqual([]);
  });

  it("should ignore campaigns with unknown layout", () => {
    const grouped = new Map<string, GenericAwarenessModalBrazeCard[]>([
      [
        "campaign-unknown",
        [
          makeCard("1", {
            layout: "unknown",
            campaignId: "campaign-unknown",
            title: "Ignored",
          }),
        ],
      ],
    ]);

    expect(buildGenericAwarenessModalContentCards(grouped)).toEqual([]);
  });

  it("should default missing carousel extras to empty strings", () => {
    const grouped = new Map<string, GenericAwarenessModalBrazeCard[]>([
      [
        "campaign-1",
        [
          makeCard("1", {
            layout: GenericAwarenessModalLayout.Carousel,
            campaignId: "campaign-1",
            index: "0",
          }),
        ],
      ],
    ]);

    expect(buildGenericAwarenessModalContentCards(grouped)).toEqual([
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
    expect(
      processGenericAwarenessModalBrazeCards([
        makeCard("1", {
          layout: GenericAwarenessModalLayout.Carousel,
          campaignId: "campaign-1",
          index: "0",
          title: "Slide 1",
          subtitle: "First",
          imageUrl: "https://example.com/1.png",
          primaryButtonLabel: "Go",
          primaryButtonLink: "https://example.com",
        }),
        makeCard("2", {
          layout: GenericAwarenessModalLayout.Carousel,
          campaignId: "invalid",
          index: "0",
          title: "Bad",
          subtitle: "Bad",
          imageUrl: "",
          primaryButtonLabel: "",
          primaryButtonLink: "",
        }),
        makeCard("3", {
          layout: GenericAwarenessModalLayout.FeatureIntro,
          campaignId: "invalid",
          role: FeatureIntroRole.Item,
          index: "0",
          icon: "",
          title: "",
          subtitle: "",
        }),
      ]),
    ).toEqual([
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
    const contentCards = processGenericAwarenessModalBrazeCards([
      makeCard("carousel-1", {
        layout: GenericAwarenessModalLayout.Carousel,
        campaignId: "campaign-carousel",
        index: "0",
        title: "Slide",
        subtitle: "Subtitle",
        imageUrl: "https://example.com/slide.png",
        primaryButtonLabel: "Go",
        primaryButtonLink: "https://example.com",
      }),
      makeCard("main", {
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
      }),
    ]);

    expect(contentCards).toHaveLength(2);
    expect(contentCards.map(card => card.id)).toEqual([
      "campaign-carousel",
      "campaign-feature-intro",
    ]);
    expect(contentCards[0]?.layout).toBe(GenericAwarenessModalLayout.Carousel);
    expect(contentCards[1]?.layout).toBe(GenericAwarenessModalLayout.FeatureIntro);
  });
});
