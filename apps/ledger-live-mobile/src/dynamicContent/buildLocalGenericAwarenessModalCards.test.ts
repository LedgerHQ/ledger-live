import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  buildDefaultGenericAwarenessModalFormValues,
  buildLocalGenericAwarenessModalBrazeCards,
  buildLocalGenericAwarenessModalContentCards,
  getDefaultGenericAwarenessModalCampaignId,
} from "./buildLocalGenericAwarenessModalCards";

describe("buildLocalGenericAwarenessModalCards", () => {
  it("should build carousel content cards from raw Braze-like cards", () => {
    const values = {
      ...buildDefaultGenericAwarenessModalFormValues(),
      campaignId: "debug-carousel",
      items: [
        {
          title: "Second",
          subtitle: "Second slide",
          imageUrl: "https://example.com/second.png",
          primaryButtonLabel: "Next",
          primaryButtonLink: "ledgerlive://portfolio",
        },
        {
          title: "First",
          subtitle: "First slide",
          imageUrl: "https://example.com/first.png",
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
        data: [
          {
            title: "Second",
            subtitle: "Second slide",
            imageUrl: "https://example.com/second.png",
            primaryButtonLabel: "Next",
            primaryButtonLink: "ledgerlive://portfolio",
          },
          {
            title: "First",
            subtitle: "First slide",
            imageUrl: "https://example.com/first.png",
            primaryButtonLabel: "Start",
            primaryButtonLink: "ledgerlive://portfolio",
          },
        ],
      },
    ]);
  });

  it("should build feature intro content cards from main and item Braze-like cards", () => {
    const values = {
      ...buildDefaultGenericAwarenessModalFormValues(),
      layout: GenericAwarenessModalLayout.FeatureIntro,
      campaignId: "debug-feature-intro",
      title: "Feature intro",
      subtitle: "Feature intro subtitle",
      imageUrl: "https://example.com/main.png",
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
        title: "Feature intro",
        subtitle: "Feature intro subtitle",
        imageUrl: "https://example.com/main.png",
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
