import type { LottieProps } from "./Animation.native";
import type {
  DeviceActionAnimationTheme,
  DeviceActionContentAction,
  DeviceActionModelId,
} from "./types";

type NativeDeviceActionAnimationSource = LottieProps["source"];

import NanoSPPinLight from "./animations/native/nanoSP/light/pin.json";
import NanoSPPinDark from "./animations/native/nanoSP/dark/pin.json";
import NanoSPContinueLight from "./animations/native/nanoSP/light/continue.json";
import NanoSPContinueDark from "./animations/native/nanoSP/dark/continue.json";

import NanoXPinLight from "./animations/native/nanoX/light/pin.json";
import NanoXPinDark from "./animations/native/nanoX/dark/pin.json";
import NanoXContinueLight from "./animations/native/nanoX/light/continue.json";
import NanoXContinueDark from "./animations/native/nanoX/dark/continue.json";

import StaxPinLight from "./animations/native/stax/light/pin.json";
import StaxPinDark from "./animations/native/stax/dark/pin.json";
import StaxContinueLight from "./animations/native/stax/light/continue.json";
import StaxContinueDark from "./animations/native/stax/dark/continue.json";

import FlexPinLight from "./animations/native/flex/light/pin.json";
import FlexPinDark from "./animations/native/flex/dark/pin.json";
import FlexContinueLight from "./animations/native/flex/light/continue.json";
import FlexContinueDark from "./animations/native/flex/dark/continue.json";

import ApexPinLight from "./animations/native/apex/light/pin.json";
import ApexPinDark from "./animations/native/apex/dark/pin.json";
import ApexContinueLight from "./animations/native/apex/light/continue.json";
import ApexContinueDark from "./animations/native/apex/dark/continue.json";

type AnimationRecord = Record<DeviceActionAnimationTheme, NativeDeviceActionAnimationSource>;
type DeviceActionAnimations = Record<DeviceActionContentAction, AnimationRecord>;

/** Ledger Nano S reuses the Nano S Plus animations; there's no dedicated Nano S asset set. */
type AnimationModelId = Exclude<DeviceActionModelId, "nanoS">;

const animations: Record<AnimationModelId, DeviceActionAnimations> = {
  nanoSP: {
    continue: { light: NanoSPContinueLight, dark: NanoSPContinueDark },
    "power-and-unlock": { light: NanoSPPinLight, dark: NanoSPPinDark },
  },
  nanoX: {
    continue: { light: NanoXContinueLight, dark: NanoXContinueDark },
    "power-and-unlock": { light: NanoXPinLight, dark: NanoXPinDark },
  },
  stax: {
    continue: { light: StaxContinueLight, dark: StaxContinueDark },
    "power-and-unlock": { light: StaxPinLight, dark: StaxPinDark },
  },
  europa: {
    continue: { light: FlexContinueLight, dark: FlexContinueDark },
    "power-and-unlock": { light: FlexPinLight, dark: FlexPinDark },
  },
  apex: {
    continue: { light: ApexContinueLight, dark: ApexContinueDark },
    "power-and-unlock": { light: ApexPinLight, dark: ApexPinDark },
  },
};

function toAnimationModelId(modelId: DeviceActionModelId): AnimationModelId {
  return modelId === "nanoS" ? "nanoSP" : modelId;
}

export function getDeviceActionAnimation({
  action,
  modelId,
  theme,
}: {
  action: DeviceActionContentAction;
  modelId: DeviceActionModelId;
  theme: DeviceActionAnimationTheme;
}): NativeDeviceActionAnimationSource {
  return animations[toAnimationModelId(modelId)][action][theme];
}
