import { DeviceModelId } from "@ledgerhq/types-devices";
import type { ViewStyle } from "react-native";
import type {
  DeviceActionAnimationSource,
  DeviceActionAnimationTheme,
  DeviceActionContentAction,
  SupportedDeviceActionModelId,
} from "./types";

import NanoSPPinDark from "~/animations/device/nanoSP/dark/pin.json";
import NanoSPPinLight from "~/animations/device/nanoSP/light/pin.json";
import NanoSPContinueDark from "~/animations/device/nanoSP/dark/continue.json";
import NanoSPContinueLight from "~/animations/device/nanoSP/light/continue.json";

import NanoXPinDark from "~/animations/device/nanoX/dark/pin.json";
import NanoXPinLight from "~/animations/device/nanoX/light/pin.json";
import NanoXContinueDark from "~/animations/device/nanoX/dark/continue.json";
import NanoXContinueLight from "~/animations/device/nanoX/light/continue.json";

import StaxPinDark from "~/animations/device/stax/dark/pin.json";
import StaxPinLight from "~/animations/device/stax/light/pin.json";
import StaxContinueDark from "~/animations/device/stax/dark/continue.json";
import StaxContinueLight from "~/animations/device/stax/light/continue.json";

import FlexPinDark from "~/animations/device/flex/dark/pin.json";
import FlexPinLight from "~/animations/device/flex/light/pin.json";
import FlexContinueDark from "~/animations/device/flex/dark/continue.json";
import FlexContinueLight from "~/animations/device/flex/light/continue.json";

import ApexPinDark from "~/animations/device/apex/dark/pin.json";
import ApexPinLight from "~/animations/device/apex/light/pin.json";
import ApexContinueDark from "~/animations/device/apex/dark/continue.json";
import ApexContinueLight from "~/animations/device/apex/light/continue.json";

type AnimationRecord = Record<DeviceActionAnimationTheme, DeviceActionAnimationSource>;
type DeviceActionAnimations = Record<DeviceActionContentAction, AnimationRecord>;

export const supportedDeviceActionModelIds = Object.values(DeviceModelId).filter(
  (modelId): modelId is SupportedDeviceActionModelId => modelId !== DeviceModelId.blue,
);

const animations: Record<SupportedDeviceActionModelId, DeviceActionAnimations> = {
  [DeviceModelId.nanoS]: {
    continue: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
    "power-and-unlock": {
      light: NanoSPPinLight,
      dark: NanoSPPinDark,
    },
  },
  [DeviceModelId.nanoSP]: {
    continue: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
    "power-and-unlock": {
      light: NanoSPPinLight,
      dark: NanoSPPinDark,
    },
  },
  [DeviceModelId.nanoX]: {
    continue: {
      light: NanoXContinueLight,
      dark: NanoXContinueDark,
    },
    "power-and-unlock": {
      light: NanoXPinLight,
      dark: NanoXPinDark,
    },
  },
  [DeviceModelId.stax]: {
    continue: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    "power-and-unlock": {
      light: StaxPinLight,
      dark: StaxPinDark,
    },
  },
  [DeviceModelId.europa]: {
    continue: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    "power-and-unlock": {
      light: FlexPinLight,
      dark: FlexPinDark,
    },
  },
  [DeviceModelId.apex]: {
    continue: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
    "power-and-unlock": {
      light: ApexPinLight,
      dark: ApexPinDark,
    },
  },
};

export function isSupportedDeviceActionModelId(
  modelId: DeviceModelId,
): modelId is SupportedDeviceActionModelId {
  return modelId !== DeviceModelId.blue;
}

export function getDeviceActionAnimation({
  action,
  modelId,
  theme = "light",
}: {
  action: DeviceActionContentAction;
  modelId: DeviceModelId;
  theme?: DeviceActionAnimationTheme;
}): DeviceActionAnimationSource {
  if (!isSupportedDeviceActionModelId(modelId)) return undefined;

  return animations[modelId][action][theme];
}

export function getDeviceActionAnimationStyle(modelId: DeviceModelId): ViewStyle {
  if (!isSupportedDeviceActionModelId(modelId)) return {};

  return {
    height: 200,
    width: 200,
  };
}
