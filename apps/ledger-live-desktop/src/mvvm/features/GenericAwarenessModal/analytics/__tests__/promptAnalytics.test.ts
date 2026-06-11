import { track, trackPage } from "~/renderer/analytics/segment";
import { promptCampaignCard } from "../../testUtils/fixtures";
import {
  getPromptAnalyticsContext,
  trackPromptPage,
  trackPromptPrimaryClick,
  trackPromptSecondaryClick,
} from "../promptAnalytics";
import { PAGE_TRACKING_AWARENESS_MODAL_PROMPT } from "../const";

describe("promptAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should build context and track the prompt page", () => {
    expect(getPromptAnalyticsContext(promptCampaignCard)).toEqual({
      page: PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
      contentId: promptCampaignCard.id,
    });

    trackPromptPage(promptCampaignCard);

    expect(trackPage).toHaveBeenCalledWith(
      PAGE_TRACKING_AWARENESS_MODAL_PROMPT,
      undefined,
      expect.objectContaining({ contentId: promptCampaignCard.id }),
      true,
      false,
    );
  });

  it("should track normalized primary and secondary button clicks", () => {
    const context = getPromptAnalyticsContext(promptCampaignCard);

    trackPromptPrimaryClick(context, "  Learn more  ", "https://www.ledger.com/academy");
    trackPromptSecondaryClick(context, "Maybe later", "https://www.ledger.com");

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "learn more",
        ctaPosition: "primary",
        link: "https://www.ledger.com/academy",
      }),
    );
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        button: "maybe later",
        ctaPosition: "secondary",
        link: "https://www.ledger.com",
      }),
    );
  });
});
