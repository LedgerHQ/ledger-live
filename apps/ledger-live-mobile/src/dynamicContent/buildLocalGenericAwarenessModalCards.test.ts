import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  buildDefaultGenericAwarenessModalFormValues,
  buildLocalGenericAwarenessModalBrazeCards,
  buildLocalGenericAwarenessModalContentCards,
  getDefaultGenericAwarenessModalCampaignId,
  type GenericAwarenessModalDebugFormValues,
} from "./buildLocalGenericAwarenessModalCards";

describe("buildLocalGenericAwarenessModalCards", () => {
  it("should build carousel content cards from raw Braze-like cards", () => {
    const values: GenericAwarenessModalDebugFormValues = {
      ...buildDefaultGenericAwarenessModalFormValues(),
      campaignId: "debug-carousel",
      items: [
        {
          title: "Second",
          subtitle: "Second slide",
          imageUrlLight: "https://example.com/second.png",
          imageUrlDark: "",
          primaryButtonLabel: "Next",
          primaryButtonLink: "ledgerlive://portfolio",
        },
        {
          title: "First",
          subtitle: "First slide",
          imageUrlLight: "https://example.com/first.png",
          imageUrlDark: "",
          primaryButtonLabel: "Start",
          primaryButtonLink: "ledgerlive://portfolio",
        },
      ],
    };

    const rawCards = buildLocalGenericAwarenessModalBrazeCards(values);
    const contentCards = buildLocalGenericAwarenessModalContentCards(values);

    expect(rawCards).toHaveLength(2);
    expect(rawCards[0].extras).toMatchObject({
      campaignId: "debug-carousel",
      layout: GenericAwarenessModalLayout.Carousel,
      location: "generic_awareness_modal",
      index: "0",
    });
    expect(contentCards).toEqual([
      {
        id: "debug-carousel",
        isLocal: true,
        layout: GenericAwarenessModalLayout.Carousel,
        isReady: true,
        data: [
          {
            title: "Second",
            subtitle: "Second slide",
            imageUrlLight: "https://example.com/second.png",
            imageUrlDark: "",
            primaryButtonLabel: "Next",
            primaryButtonLink: "ledgerlive://portfolio",
            navigationButtonLabel: "",
          },
          {
            title: "First",
            subtitle: "First slide",
            imageUrlLight: "https://example.com/first.png",
            imageUrlDark: "",
            primaryButtonLabel: "Start",
            primaryButtonLink: "ledgerlive://portfolio",
            navigationButtonLabel: "",
          },
        ],
      },
    ]);
  });

  it("should build feature intro content cards from main and item Braze-like cards", () => {
    const values: GenericAwarenessModalDebugFormValues = {
      ...buildDefaultGenericAwarenessModalFormValues(),
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "debug-feature-intro",
      title: "Feature intro",
      subtitle: "Feature intro subtitle",
      imageUrlLight: "https://example.com/main.png",
      imageUrlDark: "",
      primaryButtonLabel: "Start",
      primaryButtonLink: "ledgerlive://buy",
      secondaryButtonLabel: "Later",
      secondaryButtonLink: "ledgerlive://portfolio",
      items: [
        {
          icon: "Shield",
          title: "Secure",
          subtitle: "Keep keys safe.",
        },
      ],
    };

    const rawCards = buildLocalGenericAwarenessModalBrazeCards(values);
    const contentCards = buildLocalGenericAwarenessModalContentCards(values);

    expect(rawCards).toHaveLength(2);
    expect(rawCards[0].extras).toMatchObject({
      campaignId: "debug-feature-intro",
      layout: GenericAwarenessModalLayout.FeatureIntro,
      role: "main",
      location: "generic_awareness_modal",
    });
    expect(rawCards[1].extras).toMatchObject({
      role: "item",
      index: "0",
    });
    expect(contentCards).toEqual([
      {
        id: "debug-feature-intro",
        isLocal: true,
        layout: GenericAwarenessModalLayout.FeatureIntro,
        isReady: true,
        title: "Feature intro",
        subtitle: "Feature intro subtitle",
        imageUrlLight: "https://example.com/main.png",
        imageUrlDark: "",
        primaryButtonLabel: "Start",
        primaryButtonLink: "ledgerlive://buy",
        secondaryButtonLabel: "Later",
        secondaryButtonLink: "ledgerlive://portfolio",
        items: [
          {
            icon: "Shield",
            title: "Secure",
            subtitle: "Keep keys safe.",
          },
        ],
      },
    ]);
  });

  it("should build prompt content cards from one Braze-like card", () => {
    const values: GenericAwarenessModalDebugFormValues = {
      ...buildDefaultGenericAwarenessModalFormValues(),
      layout: GenericAwarenessModalLayout.Prompt,
      campaignId: "debug-prompt",
      title: "Prompt title",
      subtitle: "Prompt subtitle",
      imageUrlLight: "https://example.com/prompt.png",
      imageUrlDark: "",
      primaryButtonLabel: "Learn more",
      primaryButtonLink: "https://example.com",
      secondaryButtonLabel: "Maybe later",
      secondaryButtonLink: "ledgerlive://myledger",
    };

    const rawCards = buildLocalGenericAwarenessModalBrazeCards(values);
    const contentCards = buildLocalGenericAwarenessModalContentCards(values);

    expect(rawCards).toHaveLength(1);
    expect(rawCards[0].extras).toMatchObject({
      campaignId: "debug-prompt",
      layout: GenericAwarenessModalLayout.Prompt,
      location: "generic_awareness_modal",
      title: "Prompt title",
      subtitle: "Prompt subtitle",
      imageUrlLight: "https://example.com/prompt.png",
      imageUrlDark: "",
      primaryButtonLabel: "Learn more",
      primaryButtonLink: "https://example.com",
      secondaryButtonLabel: "Maybe later",
      secondaryButtonLink: "ledgerlive://myledger",
    });
    expect(rawCards[0].extras).not.toHaveProperty("index");
    expect(rawCards[0].extras).not.toHaveProperty("role");
    expect(contentCards).toEqual([
      {
        id: "debug-prompt",
        isLocal: true,
        layout: GenericAwarenessModalLayout.Prompt,
        title: "Prompt title",
        subtitle: "Prompt subtitle",
        imageUrlLight: "https://example.com/prompt.png",
        imageUrlDark: "",
        primaryButtonLabel: "Learn more",
        primaryButtonLink: "https://example.com",
        secondaryButtonLabel: "Maybe later",
        secondaryButtonLink: "ledgerlive://myledger",
      },
    ]);
  });

  it("should pass carousel navigationButtonLabel from debug form to Braze extras", () => {
    const values: GenericAwarenessModalDebugFormValues = {
      ...buildDefaultGenericAwarenessModalFormValues(),
      campaignId: "debug-carousel-nav",
      items: [
        {
          title: "Slide one",
          subtitle: "Keep going",
          navigationButtonLabel: "Keep going",
        },
        {
          title: "Slide two",
          subtitle: "All done",
          navigationButtonLabel: "Done for now",
        },
      ],
    };

    const rawCards = buildLocalGenericAwarenessModalBrazeCards(values);
    const contentCards = buildLocalGenericAwarenessModalContentCards(values);

    expect(rawCards[0].extras).toMatchObject({
      navigationButtonLabel: "Keep going",
    });
    expect(rawCards[1].extras).toMatchObject({
      navigationButtonLabel: "Done for now",
    });
    expect(contentCards[0]).toMatchObject({
      layout: GenericAwarenessModalLayout.Carousel,
      data: [
        expect.objectContaining({ navigationButtonLabel: "Keep going" }),
        expect.objectContaining({ navigationButtonLabel: "Done for now" }),
      ],
    });
  });

  it("should provide app-start and deeplink campaign defaults", () => {
    const appStartCampaignId = getDefaultGenericAwarenessModalCampaignId(
      GenericAwarenessModalLayout.Carousel,
      "appStart",
    );
    const deeplinkCampaignId = getDefaultGenericAwarenessModalCampaignId(
      GenericAwarenessModalLayout.Carousel,
      "deeplink",
    );

    expect(appStartCampaignId).toBe("app_start_debug_generic_awareness_carousel");
    expect(deeplinkCampaignId).toBe("debug_generic_awareness_carousel");
  });
});
