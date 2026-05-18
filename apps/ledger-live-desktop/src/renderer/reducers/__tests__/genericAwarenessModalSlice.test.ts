import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal/types";
import type {
  GenericAwarenessModalCarousel,
  GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal/types";
import genericAwarenessModalReducer, {
  selectGenericAwarenessModalContentCardByCampaignId,
  selectGenericAwarenessModalContentCards,
  setGenericAwarenessModalContentCards,
} from "../genericAwarenessModalSlice";

const carouselCampaign: GenericAwarenessModalCarousel = {
  layout: GenericAwarenessModalLayout.Carousel,
  id: "campaign-carousel",
  data: [
    {
      title: "Slide",
      subtitle: "Subtitle",
      imageUrl: "https://example.com/slide.png",
      primaryButtonLabel: "Go",
      primaryButtonLink: "https://example.com",
    },
  ],
};

const featureIntroCampaign: GenericAwarenessModalFeatureIntro = {
  layout: GenericAwarenessModalLayout.FeatureIntro,
  id: "campaign-feature-intro",
  title: "Title",
  subtitle: "Subtitle",
  imageUrl: "https://example.com/hero.png",
  primaryButtonLabel: "Primary",
  primaryButtonLink: "ledgerwallet://primary",
  secondaryButtonLabel: "Secondary",
  secondaryButtonLink: "ledgerwallet://secondary",
  items: [],
};

describe("genericAwarenessModalSlice", () => {
  it("should replace content cards when setGenericAwarenessModalContentCards is dispatched", () => {
    const state = genericAwarenessModalReducer(
      { contentCards: [] },
      setGenericAwarenessModalContentCards([carouselCampaign, featureIntroCampaign]),
    );

    expect(state.contentCards).toEqual([carouselCampaign, featureIntroCampaign]);
  });

  it("should select all content cards", () => {
    const state = {
      genericAwarenessModal: {
        contentCards: [carouselCampaign],
      },
    };

    expect(selectGenericAwarenessModalContentCards(state)).toEqual([carouselCampaign]);
  });

  it("should select content card by campaign id", () => {
    const state = {
      genericAwarenessModal: {
        contentCards: [carouselCampaign, featureIntroCampaign],
      },
    };

    expect(selectGenericAwarenessModalContentCardByCampaignId(state, "campaign-carousel")).toBe(
      carouselCampaign,
    );
    expect(
      selectGenericAwarenessModalContentCardByCampaignId(state, "campaign-feature-intro"),
    ).toBe(featureIntroCampaign);
  });

  it("should return undefined when campaign id is missing", () => {
    const state = {
      genericAwarenessModal: {
        contentCards: [carouselCampaign],
      },
    };

    expect(selectGenericAwarenessModalContentCardByCampaignId(state, undefined)).toBeUndefined();
    expect(
      selectGenericAwarenessModalContentCardByCampaignId(state, "unknown-campaign"),
    ).toBeUndefined();
  });
});
