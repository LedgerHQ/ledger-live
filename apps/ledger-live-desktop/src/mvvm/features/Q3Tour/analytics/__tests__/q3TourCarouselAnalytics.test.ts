import { track, trackPage } from "~/renderer/analytics/segment";
import { Q3_TOUR_SLIDES } from "../../Drawer/const";
import { PAGE_TRACKING_Q3_TOUR } from "../const";
import { Q3_TOUR_ANALYTICS } from "../q3TourCarouselAnalytics";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
}));

describe("q3TourCarouselAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track the Q3 campaign and current carousel step", () => {
    const context = Q3_TOUR_ANALYTICS.getContext(1, "Say goodbye to long addresses");

    expect(context).toEqual({
      page: PAGE_TRACKING_Q3_TOUR,
      contentId: "q3-tour",
      step: 2,
      stepName: "Say goodbye to long addresses",
      totalSteps: Q3_TOUR_SLIDES.length,
    });

    Q3_TOUR_ANALYTICS.trackInitialStep(
      Q3_TOUR_ANALYTICS.getContext(0, "A quick tour of the latest"),
    );

    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_Q3_TOUR,
      undefined,
      expect.objectContaining({
        contentId: "q3-tour",
        step: 1,
        stepName: "A quick tour of the latest",
      }),
      true,
      false,
    );
  });

  it("should track continue, dismiss, and completion interactions", () => {
    const context = Q3_TOUR_ANALYTICS.getContext(3, "Keep your crypto, finance your projects");

    Q3_TOUR_ANALYTICS.trackContinueClick(context);
    Q3_TOUR_ANALYTICS.trackDismissed(context);
    Q3_TOUR_ANALYTICS.trackCompleted(context);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "continue",
        page: PAGE_TRACKING_Q3_TOUR,
        contentId: "q3-tour",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "drawer_dismissed",
      expect.objectContaining({ drawer: PAGE_TRACKING_Q3_TOUR, step: 4 }),
    );
    expect(track).toHaveBeenCalledWith(
      "tour_completed",
      expect.objectContaining({ step: 4, totalSteps: Q3_TOUR_SLIDES.length }),
    );
  });
});
