import { track, trackPage } from "~/renderer/analytics/segment";
import { getQ3TourStepName, PAGE_TRACKING_Q3_TOUR } from "../const";
import { createQ3TourAnalytics } from "../q3TourCarouselAnalytics";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
}));

describe("q3TourCarouselAnalytics", () => {
  const analytics = createQ3TourAnalytics(4, "q3_a");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track the Q3 campaign, variant, and current carousel step", () => {
    const context = analytics.getContext(1, "Say goodbye to long addresses");

    expect(context).toEqual({
      page: PAGE_TRACKING_Q3_TOUR,
      contentId: "q3-tour",
      variant: "q3_a",
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
        variant: "q3_a",
        step: 1,
        stepName: "A quick tour of the latest",
      }),
      true,
      false,
    );
  });

  it("should track continue, dismiss, and completion interactions with the variant", () => {
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
        variant: "q3_a",
        ctaPosition: "primary",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "drawer_dismissed",
      expect.objectContaining({ drawer: PAGE_TRACKING_Q3_TOUR, step: 4, variant: "q3_a" }),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "continue",
        ctaPosition: "primary",
        step: 4,
        totalSteps: 4,
        variant: "q3_a",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "tour_completed",
      expect.objectContaining({ step: 4, totalSteps: 4, variant: "q3_a" }),
    );
  });

  it("should track the last-step CTA as primary continue and complete the tour", () => {
    const context = analytics.getContext(3, "Keep your crypto, finance your projects");

    analytics.trackCompleted(context);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "continue",
        ctaPosition: "primary",
        step: 4,
        totalSteps: 4,
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "tour_completed",
      expect.objectContaining({ step: 4, totalSteps: 4, variant: "q3_a" }),
    );
  });

  it("should use the selected variant slide count and id", () => {
    const q3BAnalytics = createQ3TourAnalytics(3, "q3_b");

    expect(q3BAnalytics.getContext(2, "Keep your crypto, finance your projects")).toEqual(
      expect.objectContaining({ step: 3, totalSteps: 3, variant: "q3_b" }),
    );
  });

  it("should resolve step names from English copy, not i18n keys", () => {
    expect(getQ3TourStepName("q3Tour.slides.contactNoPay.title")).toBe("Say hello to Contacts");
    expect(getQ3TourStepName("q3Tour.slides.intro.title")).toBe("A quick tour of the latest");
  });
});
