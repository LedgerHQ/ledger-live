import { DeviceModelId } from "@ledgerhq/types-devices";
import { screen, track } from "~/analytics";

export const LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME = "Modal - Upgrade";

export type LargeScreenUpsellDismissMethod = "close button" | "outside tap";

export type LargeScreenUpsellNanoDeviceModelId =
  | DeviceModelId.nanoS
  | DeviceModelId.nanoSP
  | DeviceModelId.nanoX;

export type LargeScreenUpsellDeviceModelAnalyticsValue = "lns" | "lnsp" | "lnx";

const DEVICE_MODEL_ANALYTICS_VALUES: Record<
  LargeScreenUpsellNanoDeviceModelId,
  LargeScreenUpsellDeviceModelAnalyticsValue
> = {
  [DeviceModelId.nanoS]: "lns",
  [DeviceModelId.nanoSP]: "lnsp",
  [DeviceModelId.nanoX]: "lnx",
};

export function toLargeScreenUpsellDeviceModelAnalyticsValue(
  deviceModelId: LargeScreenUpsellNanoDeviceModelId,
): LargeScreenUpsellDeviceModelAnalyticsValue {
  return DEVICE_MODEL_ANALYTICS_VALUES[deviceModelId];
}

export type LargeScreenUpsellSharedAnalyticsProps = Readonly<{
  deviceModel: LargeScreenUpsellDeviceModelAnalyticsValue;
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "lwm";
  retriesUpsellModal: number;
  throttled: boolean;
}>;

export function trackLargeScreenUpsellModalViewed(
  sharedProps: LargeScreenUpsellSharedAnalyticsProps,
) {
  screen(LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME, undefined, {
    name: LARGE_SCREEN_UPSELL_MODAL_PAGE_NAME,
    sourceFlow: "app start",
    modalFrequencyState: "every start",
    ...sharedProps,
  });
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
