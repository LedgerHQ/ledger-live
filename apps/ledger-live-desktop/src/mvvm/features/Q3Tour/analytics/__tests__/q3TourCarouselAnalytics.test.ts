import { track, trackPage } from "~/renderer/analytics/segment";
import { PAGE_TRACKING_Q3_TOUR } from "../const";
import { createQ3TourAnalytics } from "../q3TourCarouselAnalytics";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
}));

describe("q3TourCarouselAnalytics", () => {
  const analytics = createQ3TourAnalytics(4);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track the Q3 campaign and current carousel step", () => {
    const context = analytics.getContext(1, "Say goodbye to long addresses");

    expect(context).toEqual({
      page: PAGE_TRACKING_Q3_TOUR,
      contentId: "q3-tour",
      step: 2,
      stepName: "Say goodbye to long addresses",
      totalSteps: 4,
    });

    analytics.trackInitialStep(analytics.getContext(0, "A quick tour of the latest"));

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
    const context = analytics.getContext(3, "Keep your crypto, finance your projects");

    analytics.trackContinueClick(context);
    analytics.trackDismissed(context);
    analytics.trackCompleted(context);

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
      expect.objectContaining({ step: 4, totalSteps: 4 }),
    );
  });

  it("should use the selected variant slide count", () => {
    const q3BAnalytics = createQ3TourAnalytics(3);

    expect(q3BAnalytics.getContext(2, "Keep your crypto, finance your projects")).toEqual(
      expect.objectContaining({ step: 3, totalSteps: 3 }),
    );
  });
});
