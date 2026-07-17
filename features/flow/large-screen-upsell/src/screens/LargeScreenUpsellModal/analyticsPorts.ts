import type { NanoDeviceModelId } from "../../types";

export type LargeScreenUpsellDismissMethod = "close button" | "outside tap" | "escape key down";

export type LargeScreenUpsellModalViewedContext = Readonly<{
  deviceModelId: NanoDeviceModelId;
}>;

export type LargeScreenUpsellModalAnalyticsPorts = Readonly<{
  onModalViewed: (context: LargeScreenUpsellModalViewedContext) => void;
  onCtaClicked: () => void;
  onDismissed: (method: LargeScreenUpsellDismissMethod) => void;
}>;
