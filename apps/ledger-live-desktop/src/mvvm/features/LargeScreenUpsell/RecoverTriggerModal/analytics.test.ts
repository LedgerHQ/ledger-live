import { LARGE_SCREEN_UPSELL_UTM } from "@features/flow-large-screen-upsell";
import { track, trackPage } from "~/renderer/analytics/segment";
import {
  RECOVER_TRIGGER_CTA_BUTTON,
  RECOVER_TRIGGER_DISMISS_BUTTON,
  RECOVER_TRIGGER_PAGE_NAME,
  trackRecoverTriggerCtaClicked,
  trackRecoverTriggerDeeplinkClicked,
  trackRecoverTriggerDismissClicked,
  trackRecoverTriggerModalViewed,
  type RecoverTriggerSharedAnalyticsProps,
} from "./analytics";

const SHARED_PROPS: RecoverTriggerSharedAnalyticsProps = {
  deviceModel: "lns",
  personalRecoOptIn: false,
  offerType: "none",
  platform: "lwd",
};

describe("Recover trigger analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should emit page, CTA, dismiss, and deeplink payloads", () => {
    trackRecoverTriggerModalViewed(SHARED_PROPS);
    trackRecoverTriggerCtaClicked(SHARED_PROPS);
    trackRecoverTriggerDismissClicked(RECOVER_TRIGGER_DISMISS_BUTTON.notNow, SHARED_PROPS);
    trackRecoverTriggerDeeplinkClicked(SHARED_PROPS);

    expect(trackPage).toHaveBeenCalledWith(
      RECOVER_TRIGGER_PAGE_NAME,
      undefined,
      {
        name: RECOVER_TRIGGER_PAGE_NAME,
        sourceFlow: "recover",
        ...SHARED_PROPS,
      },
      true,
      false,
    );
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: RECOVER_TRIGGER_CTA_BUTTON,
      page: RECOVER_TRIGGER_PAGE_NAME,
      ...SHARED_PROPS,
    });
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: RECOVER_TRIGGER_DISMISS_BUTTON.notNow,
      page: RECOVER_TRIGGER_PAGE_NAME,
      ...SHARED_PROPS,
    });
    expect(track).toHaveBeenCalledWith("deeplink_clicked", {
      page: RECOVER_TRIGGER_PAGE_NAME,
      deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
      deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
      deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
      ...SHARED_PROPS,
    });
  });
});
