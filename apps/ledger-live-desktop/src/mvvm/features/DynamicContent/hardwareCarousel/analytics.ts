import { track, trackPage } from "~/renderer/analytics/segment";

export const HARDWARE_CAROUSEL_PAGE = "carousel hardware";

export type HardwareCarouselDeviceModel = "lnx" | "lnsp";

export type HardwareCarouselSharedAnalyticsProps = Readonly<{
  deviceModel: HardwareCarouselDeviceModel;
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "lwd";
}>;

export type HardwareCarouselDevice = "ledger gen5" | "ledger flex" | "ledger stax";

type HardwareCarouselButton = HardwareCarouselDevice | "close" | "close all";

function buildHardwareCarouselPageEventProperties(
  sharedProps: HardwareCarouselSharedAnalyticsProps,
) {
  return {
    name: HARDWARE_CAROUSEL_PAGE,
    ...sharedProps,
  };
}

function trackHardwareCarouselButtonClick(
  button: HardwareCarouselButton,
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  track("button_clicked", {
    button,
    page: HARDWARE_CAROUSEL_PAGE,
    ...sharedProps,
  });
}

export function trackHardwareCarouselShown(
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  trackPage(
    HARDWARE_CAROUSEL_PAGE,
    undefined,
    buildHardwareCarouselPageEventProperties(sharedProps),
    true,
    false,
  );
}

export function trackHardwareCarouselDeviceClick(
  device: HardwareCarouselDevice,
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  trackHardwareCarouselButtonClick(device, sharedProps);
}

export function trackHardwareCarouselCardDismiss(
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  trackHardwareCarouselButtonClick("close", sharedProps);
}

export function trackHardwareCarouselCloseAll(
  sharedProps: HardwareCarouselSharedAnalyticsProps,
): void {
  trackHardwareCarouselButtonClick("close all", sharedProps);
}
