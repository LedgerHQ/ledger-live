import { DeviceModelId } from "@ledgerhq/types-devices";
import type { LottieViewProps } from "lottie-react-native";
import { ViewStyle } from "react-native";

import BluePlugAndPinCode from "../animations/device/blue/1PlugAndPinCode/data.json";
import BlueEnterPinCode from "../animations/device/blue/3EnterPinCode/data.json";
import BlueQuitApp from "../animations/device/blue/4QuitApp/data.json";
import BlueAllowManager from "../animations/device/blue/5AllowManager/data.json";
import BlueOpenApp from "../animations/device/blue/6OpenApp/data.json";
import BlueValidate from "../animations/device/blue/7Validate/data.json";

import NanoSPPinDark from "../animations/device/nanoSP/dark/pin.json";
import NanoSPPinLight from "../animations/device/nanoSP/light/pin.json";
import NanoSPContinueDark from "../animations/device/nanoSP/dark/continue.json";
import NanoSPContinueLight from "../animations/device/nanoSP/light/continue.json";

import NanoXPinDark from "../animations/device/nanoX/dark/pin.json";
import NanoXPinLight from "../animations/device/nanoX/light/pin.json";
import NanoXContinueDark from "../animations/device/nanoX/dark/continue.json";
import NanoXContinueLight from "../animations/device/nanoX/light/continue.json";
import NanoXPairingDark from "../animations/device/nanoX/dark/pairing.json";
import NanoXPairingLight from "../animations/device/nanoX/light/pairing.json";
import NanoXPairedDark from "../animations/device/nanoX/dark/paired.json";
import NanoXPairedLight from "../animations/device/nanoX/light/paired.json";

import StaxPinDark from "../animations/device/stax/dark/pin.json";
import StaxPinLight from "../animations/device/stax/light/pin.json";
import StaxContinueDark from "../animations/device/stax/dark/continue.json";
import StaxContinueLight from "../animations/device/stax/light/continue.json";
import StaxPairingDark from "../animations/device/stax/dark/pairing.json";
import StaxPairingLight from "../animations/device/stax/light/pairing.json";
import StaxPairedLight from "../animations/device/stax/light/paired.json";
import StaxPairedDark from "../animations/device/stax/dark/paired.json";
import StaxSignDark from "../animations/device/stax/dark/sign.json";
import StaxSignLight from "../animations/device/stax/light/sign.json";

import FlexPinDark from "../animations/device/flex/dark/pin.json";
import FlexPinLight from "../animations/device/flex/light/pin.json";
import FlexContinueDark from "../animations/device/flex/dark/continue.json";
import FlexContinueLight from "../animations/device/flex/light/continue.json";
import FlexPairingDark from "../animations/device/flex/dark/pairing.json";
import FlexPairingLight from "../animations/device/flex/light/pairing.json";
import FlexPairedLight from "../animations/device/flex/light/paired.json";
import FlexPairedDark from "../animations/device/flex/dark/paired.json";
import FlexSignDark from "../animations/device/flex/dark/sign.json";
import FlexSignLight from "../animations/device/flex/light/sign.json";

import NanoSPlugAndPinCodeDark from "../animations/device/nanoS/1PlugAndPinCode/dark.json";
import NanoSPlugAndPinCodeLight from "../animations/device/nanoS/1PlugAndPinCode/light.json";
import NanoSEnterPinCodeDark from "../animations/device/nanoS/3EnterPinCode/dark.json";
import NanoSEnterPinCodeLight from "../animations/device/nanoS/3EnterPinCode/light.json";
import NanoSQuitAppDark from "../animations/device/nanoS/4QuitApp/dark.json";
import NanoSQuitAppLight from "../animations/device/nanoS/4QuitApp/light.json";
import NanoSOpenAppDark from "../animations/device/nanoS/6OpenApp/dark.json";
import NanoSOpenAppLight from "../animations/device/nanoS/6OpenApp/light.json";
import NanoSValidateDark from "../animations/device/nanoS/7Validate/dark.json";
import NanoSValidateLight from "../animations/device/nanoS/7Validate/light.json";

export type AnimationSource = LottieViewProps["source"];
export type AnimationRecord = Record<"light" | "dark", AnimationSource>;

type NanoSKeys = CommonKeys;
type NanoSPKeys = CommonKeys;
type BlueKeys = CommonKeys;
type NanoXKeys = CommonKeys | BleKeys;
type StaxKeys = CommonKeys | BleKeys;
type FlexKeys = CommonKeys | BleKeys;

const commonKeysArray = [
  "plugAndPinCode",
  "enterPinCode",
  "quitApp",
  "allowManager",
  "openApp",
  "verify",
  "sign",
  "allowUpdate",
] as const;
const bleKeysArray = ["blePairing", "blePaired"] as const;

type CommonKeys = (typeof commonKeysArray)[number];
type BleKeys = (typeof bleKeysArray)[number];

const deviceModelIdToKeys = {
  [DeviceModelId.nanoS]: commonKeysArray,
  [DeviceModelId.nanoSP]: commonKeysArray,
  [DeviceModelId.blue]: commonKeysArray,
  [DeviceModelId.nanoX]: [...commonKeysArray, ...bleKeysArray],
  [DeviceModelId.stax]: [...commonKeysArray, ...bleKeysArray],
  [DeviceModelId.europa]: [...commonKeysArray, ...bleKeysArray],
} as const;

// Function implementation
export function getAnimationKeysForDeviceModelId<M extends DeviceModelId>(
  modelId: M,
): readonly DeviceModelIdToKeys[M][] {
  return deviceModelIdToKeys[modelId] as readonly DeviceModelIdToKeys[M][];
}

type DeviceModelIdToKeys = {
  [DeviceModelId.nanoS]: NanoSKeys;
  [DeviceModelId.nanoSP]: NanoSPKeys;
  [DeviceModelId.blue]: BlueKeys;
  [DeviceModelId.nanoX]: NanoXKeys;
  [DeviceModelId.stax]: StaxKeys;
  [DeviceModelId.europa]: FlexKeys;
};

type AnimationsCollection = {
  [M in DeviceModelId]: Record<DeviceModelIdToKeys[M], AnimationRecord>;
};

const animations: AnimationsCollection = {
  nanoS: {
    plugAndPinCode: {
      light: NanoSPlugAndPinCodeLight,
      dark: NanoSPlugAndPinCodeDark,
    },
    enterPinCode: {
      light: NanoSEnterPinCodeLight,
      dark: NanoSEnterPinCodeDark,
    },
    quitApp: {
      light: NanoSQuitAppLight,
      dark: NanoSQuitAppDark,
    },
    allowManager: {
      light: NanoSValidateLight,
      dark: NanoSValidateDark,
    },
    openApp: {
      light: NanoSOpenAppLight,
      dark: NanoSOpenAppDark,
    },
    verify: {
      light: NanoSValidateLight,
      dark: NanoSValidateDark,
    },
    sign: {
      light: NanoSValidateLight,
      dark: NanoSValidateDark,
    },
    allowUpdate: {
      light: NanoSValidateLight,
      dark: NanoSValidateDark,
    },
  },
  nanoSP: {
    plugAndPinCode: {
      light: NanoSPPinLight,
      dark: NanoSPPinDark,
    },
    enterPinCode: {
      light: NanoSPPinLight,
      dark: NanoSPPinDark,
    },
    quitApp: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
    allowManager: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
    openApp: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
    verify: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
    sign: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
    allowUpdate: {
      light: NanoSPContinueLight,
      dark: NanoSPContinueDark,
    },
  },
  blue: {
    plugAndPinCode: {
      light: BluePlugAndPinCode,
      dark: BluePlugAndPinCode,
    },
    enterPinCode: {
      light: BlueEnterPinCode,
      dark: BlueEnterPinCode,
    },
    quitApp: {
      light: BlueQuitApp,
      dark: BlueQuitApp,
    },
    allowManager: {
      light: BlueAllowManager,
      dark: BlueAllowManager,
    },
    openApp: {
      light: BlueOpenApp,
      dark: BlueOpenApp,
    },
    verify: {
      light: BlueValidate,
      dark: BlueValidate,
    },
    sign: {
      light: BlueValidate,
      dark: BlueValidate,
    },
    allowUpdate: {
      light: BlueValidate,
      dark: BlueValidate,
    },
  },
  nanoX: {
    plugAndPinCode: {
      light: NanoXPinLight,
      dark: NanoXPinDark,
    },
    enterPinCode: {
      light: NanoXPinLight,
      dark: NanoXPinDark,
    },
    quitApp: {
      light: NanoXContinueLight,
      dark: NanoXContinueDark,
    },
    allowManager: {
      light: NanoXContinueLight,
      dark: NanoXContinueDark,
    },
    openApp: {
      light: NanoXContinueLight,
      dark: NanoXContinueDark,
    },
    verify: {
      light: NanoXContinueLight,
      dark: NanoXContinueDark,
    },
    sign: {
      light: NanoXContinueLight,
      dark: NanoXContinueDark,
    },
    allowUpdate: {
      light: NanoXContinueLight,
      dark: NanoXContinueDark,
    },
    blePairing: {
      light: NanoXPairingLight,
      dark: NanoXPairingDark,
    },
    blePaired: {
      light: NanoXPairedLight,
      dark: NanoXPairedDark,
    },
  },
  stax: {
    plugAndPinCode: {
      light: StaxPinLight,
      dark: StaxPinDark,
    },
    enterPinCode: {
      light: StaxPinLight,
      dark: StaxPinDark,
    },
    quitApp: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    allowManager: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    openApp: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    verify: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    sign: {
      light: StaxSignLight,
      dark: StaxSignDark,
    },
    allowUpdate: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    blePairing: {
      light: StaxPairingLight,
      dark: StaxPairingDark,
    },
    blePaired: {
      light: StaxPairedLight,
      dark: StaxPairedDark,
    },
  },
  europa: {
    plugAndPinCode: {
      light: FlexPinLight,
      dark: FlexPinDark,
    },
    enterPinCode: {
      light: FlexPinLight,
      dark: FlexPinDark,
    },
    quitApp: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    allowManager: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    openApp: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    verify: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    sign: {
      light: FlexSignLight,
      dark: FlexSignDark,
    },
    allowUpdate: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    blePairing: {
      light: FlexPairingLight,
      dark: FlexPairingDark,
    },
    blePaired: {
      light: FlexPairedLight,
      dark: FlexPairedDark,
    },
  },
};

export type GetDeviceAnimationArgs<M extends DeviceModelId = DeviceModelId> = {
  theme?: "light" | "dark";
  modelId: M;
  key: DeviceModelIdToKeys[M];
};

// Return an animation associated to a device
export function getDeviceAnimation<M extends DeviceModelId>({
  theme = "light",
  key,
  modelId,
}: GetDeviceAnimationArgs<M>): AnimationSource {
  const animation = animations[modelId][key][theme];

  if (!animation) {
    console.error(`No animation for ${modelId} ${key}`);
    // @ts-expect-error Halp :()
    return undefined;
  }

  return animation;
}

export const getDeviceAnimationStyles = (modelId: DeviceModelId, override: ViewStyle = {}) => {
  switch (modelId) {
    case DeviceModelId.nanoSP:
    case DeviceModelId.nanoX:
    case DeviceModelId.stax:
    case DeviceModelId.europa:
      return { height: 165, ...override };
    default:
      return {};
  }
};
