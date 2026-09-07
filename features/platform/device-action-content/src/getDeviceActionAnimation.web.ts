import type {
  DeviceActionAnimationSource,
  DeviceActionAnimationTheme,
  DeviceActionContentAction,
  DeviceActionModelId,
} from "./types";

import NanoSPPinLight from "./animations/web/nanoSP/light/pin.json";
import NanoSPPinDark from "./animations/web/nanoSP/dark/pin.json";
import NanoSPContinueLight from "./animations/web/nanoSP/light/continue.json";
import NanoSPContinueDark from "./animations/web/nanoSP/dark/continue.json";

import NanoXPinLight from "./animations/web/nanoX/light/pin.json";
import NanoXPinDark from "./animations/web/nanoX/dark/pin.json";
import NanoXContinueLight from "./animations/web/nanoX/light/continue.json";
import NanoXContinueDark from "./animations/web/nanoX/dark/continue.json";

import StaxPinLight from "./animations/web/stax/light/pin.json";
import StaxPinDark from "./animations/web/stax/dark/pin.json";
import StaxContinueLight from "./animations/web/stax/light/continue.json";
import StaxContinueDark from "./animations/web/stax/dark/continue.json";

import FlexPinLight from "./animations/web/flex/light/pin.json";
import FlexPinDark from "./animations/web/flex/dark/pin.json";
import FlexContinueLight from "./animations/web/flex/light/continue.json";
import FlexContinueDark from "./animations/web/flex/dark/continue.json";

import ApexPinLight from "./animations/web/apex/light/pin.json";
import ApexPinDark from "./animations/web/apex/dark/pin.json";
import ApexContinueLight from "./animations/web/apex/light/continue.json";
import ApexContinueDark from "./animations/web/apex/dark/continue.json";

type AnimationRecord = Record<DeviceActionAnimationTheme, DeviceActionAnimationSource>;
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
}): DeviceActionAnimationSource {
  return animations[toAnimationModelId(modelId)][action][theme];
}
