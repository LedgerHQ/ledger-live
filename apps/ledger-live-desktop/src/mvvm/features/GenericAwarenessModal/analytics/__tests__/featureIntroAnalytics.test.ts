import { track, trackPage } from "~/renderer/analytics/segment";
import { appStartFeatureIntroCard } from "../../__tests__/fixtures";
import {
  getFeatureIntroAnalyticsContext,
  normalizeFeatureIntroButtonName,
  trackFeatureIntroPage,
  trackFeatureIntroPrimaryClick,
  trackFeatureIntroSecondaryClick,
} from "../featureIntroAnalytics";
import { PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO } from "../const";

describe("featureIntroAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build analytics context from feature intro campaign id", () => {
    const context = getFeatureIntroAnalyticsContext(appStartFeatureIntroCard);

    expect(context).toEqual({
      page: PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
      contentId: appStartFeatureIntroCard.id,
    });
  });

  it("should normalize button labels for tracking", () => {
    expect(normalizeFeatureIntroButtonName("  Got it  ")).toBe("got it");
  });

  it("should track feature intro page on display", () => {
    trackFeatureIntroPage(appStartFeatureIntroCard);

    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
      undefined,
      expect.objectContaining({
        name: PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
        contentId: appStartFeatureIntroCard.id,
      }),
      true,
      false,
    );
  });

  it("should track primary and secondary button clicks", () => {
    const context = getFeatureIntroAnalyticsContext(appStartFeatureIntroCard);

    trackFeatureIntroPrimaryClick(context, "Got it");
    trackFeatureIntroSecondaryClick(context, "Compare signers");

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "got it",
        contentId: appStartFeatureIntroCard.id,
        ctaPosition: "primary",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "compare signers",
        contentId: appStartFeatureIntroCard.id,
        ctaPosition: "secondary",
      }),
    );
  });
});
