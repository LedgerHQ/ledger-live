import { track, trackPage } from "~/renderer/analytics/segment";
import { appStartFeatureIntroCard } from "../../testUtils/fixtures";
import {
  getFeatureIntroAnalyticsContext,
  trackFeatureIntroPage,
  trackFeatureIntroPrimaryClick,
  trackFeatureIntroSecondaryClick,
} from "../featureIntroAnalytics";
import { PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO } from "../const";

describe("featureIntroAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build context and track the feature intro page", () => {
    expect(getFeatureIntroAnalyticsContext(appStartFeatureIntroCard)).toEqual({
      page: PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
      contentId: appStartFeatureIntroCard.id,
    });

    trackFeatureIntroPage(appStartFeatureIntroCard);

    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
      undefined,
      expect.objectContaining({ contentId: appStartFeatureIntroCard.id }),
      true,
      false,
    );
  });

  it("should track normalized primary and secondary button clicks", () => {
    const context = getFeatureIntroAnalyticsContext(appStartFeatureIntroCard);

    trackFeatureIntroPrimaryClick(context, "  Got it  ", "https://www.ledger.com");
    trackFeatureIntroSecondaryClick(
      context,
      "Compare signers",
      "https://www.ledger.com/compare-ledger-signers",
    );

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "got it",
        ctaPosition: "primary",
        link: "https://www.ledger.com",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "compare signers",
        ctaPosition: "secondary",
        link: "https://www.ledger.com/compare-ledger-signers",
      }),
    );
  });
});
