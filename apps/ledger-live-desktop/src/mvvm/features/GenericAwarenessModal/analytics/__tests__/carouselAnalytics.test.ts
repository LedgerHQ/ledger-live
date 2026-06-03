import { track, trackPage } from "~/renderer/analytics/segment";
import { carouselCampaignCard } from "../../testUtils/fixtures";
import {
  getCarouselAnalyticsContext,
  trackCarouselContinueClick,
  trackCarouselInitialStep,
  trackCarouselPrimaryClick,
  trackCarouselTourCompleted,
} from "../carouselAnalytics";
import { PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL } from "../const";

describe("carouselAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build context and track the initial carousel page", () => {
    expect(getCarouselAnalyticsContext(carouselCampaignCard, 1)).toEqual({
      page: PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
      contentId: carouselCampaignCard.id,
      step: 2,
      stepName: "Ledger Wallet clarity",
      totalSteps: 4,
    });

    trackCarouselInitialStep(carouselCampaignCard);

    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_AWARENESS_MODAL_CAROUSEL,
      undefined,
      expect.objectContaining({
        contentId: carouselCampaignCard.id,
        step: 1,
        stepName: "Ledger Flex",
      }),
      true,
      false,
    );
  });

  it("should track carousel button and completion events", () => {
    const context = getCarouselAnalyticsContext(carouselCampaignCard, 3);

    trackCarouselPrimaryClick(
      context,
      "  Discover Flex  ",
      "https://www.ledger.com/products/ledger-flex",
    );
    trackCarouselContinueClick(context);
    trackCarouselTourCompleted(context);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "discover flex",
        ctaPosition: "primary",
        link: "https://www.ledger.com/products/ledger-flex",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "continue",
        stepName: "Ethereum & beyond",
        ctaPosition: "secondary",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "tour_completed",
      expect.objectContaining({ stepName: "Ethereum & beyond" }),
    );
  });
});
