import { track, trackPage } from "~/renderer/analytics/segment";
import { Q2_TOUR_SLIDES } from "../../Drawer/const";
import { PAGE_TRACKING_Q2_TOUR } from "../const";
import {
  getQ2TourAnalyticsContext,
  trackQ2TourContinueClick,
  trackQ2TourInitialStep,
  trackQ2TourCompleted,
} from "../q2TourCarouselAnalytics";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
}));

describe("q2TourCarouselAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build context and track the initial carousel page", () => {
    expect(getQ2TourAnalyticsContext(1, "One balance for each asset")).toEqual({
      page: PAGE_TRACKING_Q2_TOUR,
      contentId: "q2-tour",
      step: 2,
      stepName: "One balance for each asset",
      totalSteps: Q2_TOUR_SLIDES.length,
    });

    trackQ2TourInitialStep(getQ2TourAnalyticsContext(0, Q2_TOUR_SLIDES[0].titleKey));

    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_Q2_TOUR,
      undefined,
      expect.objectContaining({
        contentId: "q2-tour",
        step: 1,
        stepName: Q2_TOUR_SLIDES[0].titleKey,
      }),
      true,
      false,
    );
  });

  it("should track carousel button and completion events", () => {
    const context = getQ2TourAnalyticsContext(4, "More protocols, more rewards");

    trackQ2TourContinueClick(context);
    trackQ2TourCompleted(context);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "continue",
        stepName: "More protocols, more rewards",
        ctaPosition: "secondary",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "tour_completed",
      expect.objectContaining({ stepName: "More protocols, more rewards" }),
    );
  });
});
