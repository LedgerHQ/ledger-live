import type { ReactNode } from "react";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { LottieViewProps } from "lottie-react-native";

/** Device-side action illustrated by the content animation. */
export type DeviceActionContentAction = "continue" | "power-and-unlock";

/** Theme variant used to select light or dark animation assets. */
export type DeviceActionAnimationTheme = "light" | "dark";

/** Lottie source returned by the device-action animation helper. */
export type DeviceActionAnimationSource = LottieViewProps["source"] | undefined;

/** Device models supported by DeviceActionContent animations. */
export type SupportedDeviceActionModelId = Exclude<DeviceModelId, DeviceModelId.blue>;

/** Lumen banner displayed below the main device instructions. */
export type DeviceActionContentBanner = Readonly<{
  /** Banner title. */
  title: string;

  /** Optional banner body copy. */
  description?: ReactNode;

  /** Visual treatment for the banner. Defaults to info. */
  appearance?: "info" | "warning" | "error";
}>;

/** Props for the shared device action content layout. */
export type DeviceActionContentProps = Readonly<{
  /** Optional centered heading above the description. */
  title?: ReactNode;

  /** Optional centered explanatory copy below the title. */
  description?: ReactNode;

  /** Optional device label rendered as a Tag below the animation. */
  deviceName?: string;

  /** Device model used to select the animation asset. */
  deviceModelId: DeviceModelId;

  /** Device-side action used to select the animation state. */
  action: DeviceActionContentAction;

  /** Optional banner rendered below the title and description. */
  banner?: DeviceActionContentBanner;

  /** Optional animation theme override. Defaults to the current styled theme. */
  theme?: DeviceActionAnimationTheme;

  /** Optional test identifier applied to the root container. */
  testID?: string;
}>;
