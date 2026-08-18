import type {
  LargeScreenUpsellDismissMethod,
  NanoDeviceModelId,
} from "@features/flow-large-screen-upsell";
import { track, trackPage } from "~/renderer/analytics/segment";

export const LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME = "Modal - Upgrade";

export type LargeScreenUpsellDeviceModelAnalyticsValue = "lns" | "lnsp" | "lnx";

const DEVICE_MODEL_ANALYTICS_VALUES: Record<
  NanoDeviceModelId,
  LargeScreenUpsellDeviceModelAnalyticsValue
> = {
  nanoS: "lns",
  nanoSP: "lnsp",
  nanoX: "lnx",
};

export function toLargeScreenUpsellDeviceModelAnalyticsValue(
  deviceModelId: NanoDeviceModelId,
): LargeScreenUpsellDeviceModelAnalyticsValue {
  return DEVICE_MODEL_ANALYTICS_VALUES[deviceModelId];
}

export type LargeScreenUpsellSharedAnalyticsProps = Readonly<{
  deviceModel: LargeScreenUpsellDeviceModelAnalyticsValue;
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "lwd";
  retriesUpsellModal: number;
  throttled: boolean;
}>;

export function trackLargeScreenUpsellModalViewed(
  sharedProps: LargeScreenUpsellSharedAnalyticsProps,
) {
  trackPage(
    LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
    undefined,
    {
      name: LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
      sourceFlow: "app start",
      modalFrequencyState: "every start",
      ...sharedProps,
    },
    true,
    false,
  );
}

export function trackLargeScreenUpsellModalCtaClicked(
  sharedProps: LargeScreenUpsellSharedAnalyticsProps,
) {
  track("button_clicked", {
    button: "explore large screen devices",
    page: LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
    ...sharedProps,
  });
}

export function trackLargeScreenUpsellModalDismissed(
  dismissMethod: LargeScreenUpsellDismissMethod,
  sharedProps: LargeScreenUpsellSharedAnalyticsProps,
) {
  track("modal_dismissed", {
    modal: "upgrade modal",
    page: LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
    dismissMethod,
    ...sharedProps,
  });
}

export type LargeScreenUpsellBlockedCompetitor = "wallet_v4_tour" | "q2_tour" | "generic_awareness";

export function trackLargeScreenUpsellModalBlockedByCompeting(
  competitor: LargeScreenUpsellBlockedCompetitor,
) {
  track("modal_blocked", {
    modal: "upgrade modal",
    page: LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
    reason: "competing_app_start_modal",
    competitor,
    platform: "lwd",
    sourceFlow: "app start",
  });
}
