import { track, trackPage } from "@shared/analytics";
import { appStartFeatureIntroCard } from "../../testUtils/fixtures";
import {
  getFeatureIntroAnalyticsContext,
  trackFeatureIntroPage,
  trackFeatureIntroPrimaryClick,
  trackFeatureIntroSecondaryClick,
} from "../featureIntroAnalytics";
import { PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO } from "../const";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

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
      {
        category: PAGE_TRACKING_AWARENESS_MODAL_FEATURE_INTRO,
        props: expect.objectContaining({ contentId: appStartFeatureIntroCard.id }),
      },
      { updateRoutes: true },
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
