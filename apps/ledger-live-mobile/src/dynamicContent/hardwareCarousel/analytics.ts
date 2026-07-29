import { track } from "~/analytics";

export const HARDWARE_CAROUSEL_PAGE = "hardware carousel";

export type HardwareCarouselDeviceModel = "lnx" | "lnsp";

export type HardwareCarouselSharedAnalyticsProps = Readonly<{
  deviceModel: HardwareCarouselDeviceModel;
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "llm";
}>;

export function trackHardwareCarouselCloseAll(
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  track("button_clicked", {
    button: "close all",
    page: HARDWARE_CAROUSEL_PAGE,
    ...sharedProps,
  });
}
