import { track, trackPage } from "~/renderer/analytics/segment";
import {
  LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
  toLargeScreenUpsellDeviceModelAnalyticsValue,
  trackLargeScreenUpsellModalCtaClicked,
  trackLargeScreenUpsellModalDismissed,
  trackLargeScreenUpsellModalViewed,
  type LargeScreenUpsellSharedAnalyticsProps,
} from "../analytics";

const SHARED_PROPS: LargeScreenUpsellSharedAnalyticsProps = {
  deviceModel: "lns",
  personalRecoOptIn: false,
  offerType: "none",
  platform: "lwd",
  retriesUpsellModal: 0,
  throttled: false,
};

describe("LargeScreenUpsell analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should map device models and emit view, CTA, and dismiss payloads", () => {
    expect(toLargeScreenUpsellDeviceModelAnalyticsValue("nanoS")).toBe("lns");
    expect(toLargeScreenUpsellDeviceModelAnalyticsValue("nanoSP")).toBe("lnsp");
    expect(toLargeScreenUpsellDeviceModelAnalyticsValue("nanoX")).toBe("lnx");

    trackLargeScreenUpsellModalViewed(SHARED_PROPS);
    trackLargeScreenUpsellModalCtaClicked(SHARED_PROPS);
    trackLargeScreenUpsellModalDismissed("escape key down", SHARED_PROPS);

    expect(trackPage).toHaveBeenCalledWith(
      LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
      undefined,
      {
        name: LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
        sourceFlow: "app start",
        modalFrequencyState: "every start",
        ...SHARED_PROPS,
      },
      true,
      false,
    );
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "explore large screen devices",
      page: LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
      ...SHARED_PROPS,
    });
    expect(track).toHaveBeenCalledWith("modal_dismissed", {
      modal: "upgrade modal",
      page: LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
      dismissMethod: "escape key down",
      ...SHARED_PROPS,
    });
  });
});
