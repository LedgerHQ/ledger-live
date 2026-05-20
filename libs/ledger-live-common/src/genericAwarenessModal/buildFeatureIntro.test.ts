import { buildFeatureIntro } from "./buildFeatureIntro";
import {
  FeatureIntroRole,
  GenericAwarenessModalLayout,
  type GenericAwarenessModalBrazeCard,
  type GenericAwarenessModalInputExtras,
} from "./types";

const makeCard = (
  id: string,
  extras: GenericAwarenessModalInputExtras,
): GenericAwarenessModalBrazeCard => ({
  id,
  extras,
});

describe("buildFeatureIntro", () => {
  it("should build feature intro content from valid main and item inputs", () => {
    const secondItemCard = makeCard("item-1", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      index: "1",
      icon: "icon-2",
      title: "Item 2",
      subtitle: "Second item",
    });
    const mainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Main,
      title: "Main title",
      subtitle: "Main subtitle",
      imageUrl: "https://example.com/hero.png",
      primaryButtonLabel: "Primary",
      primaryButtonLink: "ledgerwallet://primary",
      secondaryButtonLabel: "Secondary",
      secondaryButtonLink: "ledgerwallet://secondary",
    });
    const firstItemCard = makeCard("item-0", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      index: "0",
      icon: "icon-1",
      title: "Item 1",
      subtitle: "First item",
    });

    const featureIntro = buildFeatureIntro("campaign-1", [secondItemCard, mainCard, firstItemCard]);

    expect(featureIntro).toEqual({
      layout: GenericAwarenessModalLayout.FeatureIntro,
      id: "campaign-1",
      title: "Main title",
      subtitle: "Main subtitle",
      imageUrl: "https://example.com/hero.png",
      primaryButtonLabel: "Primary",
      primaryButtonLink: "ledgerwallet://primary",
      secondaryButtonLabel: "Secondary",
      secondaryButtonLink: "ledgerwallet://secondary",
      items: [
        {
          icon: "icon-1",
          title: "Item 1",
          subtitle: "First item",
        },
        {
          icon: "icon-2",
          title: "Item 2",
          subtitle: "Second item",
        },
      ],
    });
  });

  it("should default missing main and item fields to empty strings", () => {
    const mainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Main,
    });
    const itemCard = makeCard("item", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      index: "0",
    });

    const featureIntro = buildFeatureIntro("campaign-1", [mainCard, itemCard]);

    expect(featureIntro).toEqual({
      layout: GenericAwarenessModalLayout.FeatureIntro,
      id: "campaign-1",
      title: "",
      subtitle: "",
      imageUrl: "",
      primaryButtonLabel: "",
      primaryButtonLink: "",
      secondaryButtonLabel: "",
      secondaryButtonLink: "",
      items: [
        {
          icon: "",
          title: "",
          subtitle: "",
        },
      ],
    });
  });

  it("should return undefined when there is no valid main input", () => {
    const itemCard = makeCard("item", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      index: "0",
      title: "Item",
    });

    const featureIntro = buildFeatureIntro("campaign-1", [itemCard]);

    expect(featureIntro).toBeUndefined();
  });

  it("should skip invalid item inputs", () => {
    const mainCard = makeCard("main", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Main,
      title: "Main",
    });
    const missingIndexCard = makeCard("missing-index", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      title: "Ignored",
    });
    const validItemCard = makeCard("valid", {
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "campaign-1",
      role: FeatureIntroRole.Item,
      index: "1",
      title: "Valid",
    });

    const featureIntro = buildFeatureIntro("campaign-1", [
      mainCard,
      missingIndexCard,
      validItemCard,
    ]);

    expect(featureIntro?.items).toEqual([
      {
        icon: "",
        title: "Valid",
        subtitle: "",
      },
    ]);
  });
});
