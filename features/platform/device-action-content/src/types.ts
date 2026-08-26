import type { ReactNode } from "react";

/** Device models with a device-action animation. Excludes Ledger Blue. */
export type DeviceActionModelId = "nanoS" | "nanoSP" | "nanoX" | "stax" | "europa" | "apex";

/** Device-side action illustrated by the content animation. */
export type DeviceActionContentAction = "continue" | "power-and-unlock";

/** Theme variant used to select light or dark animation assets. */
export type DeviceActionAnimationTheme = "light" | "dark";

/** Lottie source returned by the device-action animation lookup. */
export type DeviceActionAnimationSource = Record<string, unknown>;

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

  /** Device model used to select the animation asset. Omit the animation when null. */
  deviceModelId: DeviceActionModelId | null;

  /** Device-side action used to select the animation state. */
  action: DeviceActionContentAction;

  /** Current app theme, used to select the light or dark animation asset. */
  theme: DeviceActionAnimationTheme;

  /** Optional banner rendered below the title and description. */
  banner?: DeviceActionContentBanner;

  /** Optional test identifier applied to the root container. */
  testID?: string;
}>;
