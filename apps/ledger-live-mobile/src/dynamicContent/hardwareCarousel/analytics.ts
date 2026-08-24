import { screen, track } from "~/analytics";

export const HARDWARE_CAROUSEL_PAGE = "carousel hardware";

export type HardwareCarouselDeviceModel = "lnx" | "lnsp";

export type HardwareCarouselSharedAnalyticsProps = Readonly<{
  deviceModel: HardwareCarouselDeviceModel;
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "llm";
}>;

export type HardwareCarouselDevice = "ledger gen5" | "ledger flex" | "ledger stax";

export function trackHardwareCarouselShown(
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  screen(HARDWARE_CAROUSEL_PAGE, undefined, {
    name: HARDWARE_CAROUSEL_PAGE,
    ...sharedProps,
  });
}

export function trackHardwareCarouselDeviceClick(
  device: HardwareCarouselDevice,
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  track("button_clicked", {
    button: device,
    page: HARDWARE_CAROUSEL_PAGE,
    ...sharedProps,
  });
}

export function trackHardwareCarouselCardDismiss(
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  track("button_clicked", {
    button: "close",
    page: HARDWARE_CAROUSEL_PAGE,
    ...sharedProps,
  });
}

export function trackHardwareCarouselCloseAll(
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  track("button_clicked", {
    button: "close all",
    page: HARDWARE_CAROUSEL_PAGE,
    ...sharedProps,
  });
}
