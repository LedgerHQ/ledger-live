import { track, trackPage } from "~/renderer/analytics/segment";
import { carouselCampaignCard } from "../../__tests__/fixtures";
import {
  getCarouselAnalyticsContext,
  normalizeCarouselButtonName,
  trackCarouselContinueClick,
  trackCarouselInitialStep,
  trackCarouselTourCompleted,
} from "../carouselAnalytics";
import { CAROUSEL_NAVIGATION_METHOD, PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL } from "../const";

describe("carouselAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build analytics context from carousel campaign id", () => {
    const context = getCarouselAnalyticsContext(carouselCampaignCard, 1);

    expect(context).toEqual({
      page: PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
      contentId: carouselCampaignCard.id,
      step: 2,
      totalSteps: 4,
    });
  });

  it("should normalize button labels for tracking", () => {
    expect(normalizeCarouselButtonName("  Discover Flex  ")).toBe("discover flex");
  });

  it("should track carousel page on initial step", () => {
    trackCarouselInitialStep(carouselCampaignCard);

    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
      undefined,
      expect.objectContaining({
        name: PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
        contentId: carouselCampaignCard.id,
        step: 1,
        navigationMethod: CAROUSEL_NAVIGATION_METHOD.initial,
      }),
      true,
      false,
    );
  });

  it("should track continue and tour completed events", () => {
    const context = getCarouselAnalyticsContext(carouselCampaignCard, 3);

    trackCarouselContinueClick(context);
    trackCarouselTourCompleted(context);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "continue",
        contentId: carouselCampaignCard.id,
        step: 4,
        ctaPosition: "secondary",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "tour_completed",
      expect.objectContaining({
        contentId: carouselCampaignCard.id,
        step: 4,
        completed: "yes",
      }),
    );
  });
});
