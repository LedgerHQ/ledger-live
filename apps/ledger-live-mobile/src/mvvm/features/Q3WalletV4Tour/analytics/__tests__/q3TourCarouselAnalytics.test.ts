import { screen, track } from "~/analytics";
import { getQ3TourStepName, PAGE_TRACKING_Q3_TOUR } from "../const";
import { createQ3WalletV4TourAnalytics } from "../q3TourCarouselAnalytics";

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  track: jest.fn(),
  screen: jest.fn(),
}));

describe("createQ3WalletV4TourAnalytics", () => {
  const analytics = createQ3WalletV4TourAnalytics(4, "q3_a");

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

    expect(screen).toHaveBeenCalledWith(
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

  it("should track continue as the primary CTA", () => {
    const context = analytics.getContext(0, "A quick tour of the latest");

    analytics.trackContinueClick(context);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "continue",
        ctaPosition: "primary",
        page: PAGE_TRACKING_Q3_TOUR,
        contentId: "q3-tour",
        variant: "q3_a",
      }),
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

  it("should resolve step names from English copy, not i18n keys", () => {
    expect(getQ3TourStepName("q3WalletV4Tour.contactNoPay.title")).toBe("Say hello to Contacts");
    expect(getQ3TourStepName("q3WalletV4Tour.intro.title")).toBe("A quick tour of the latest");
  });
});
