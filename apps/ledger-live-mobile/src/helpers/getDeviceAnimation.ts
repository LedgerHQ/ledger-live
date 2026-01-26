import { DeviceModelId } from "@ledgerhq/types-devices";
import type { LottieViewProps } from "lottie-react-native";
import { ViewStyle } from "react-native";

import BluePlugAndPinCode from "../animations/device/blue/1PlugAndPinCode/data.lottie";
import BlueEnterPinCode from "../animations/device/blue/3EnterPinCode/data.lottie";
import BlueQuitApp from "../animations/device/blue/4QuitApp/data.lottie";
import BlueAllowManager from "../animations/device/blue/5AllowManager/data.lottie";
import BlueOpenApp from "../animations/device/blue/6OpenApp/data.lottie";
import BlueValidate from "../animations/device/blue/7Validate/data.lottie";

import NanoSPPinDark from "../animations/device/nanoSP/dark/pin.lottie";
import NanoSPPinLight from "../animations/device/nanoSP/light/pin.lottie";
import NanoSPContinueDark from "../animations/device/nanoSP/dark/continue.lottie";
import NanoSPContinueLight from "../animations/device/nanoSP/light/continue.lottie";

import NanoXPinDark from "../animations/device/nanoX/dark/pin.lottie";
import NanoXPinLight from "../animations/device/nanoX/light/pin.lottie";
import NanoXContinueDark from "../animations/device/nanoX/dark/continue.lottie";
import NanoXContinueLight from "../animations/device/nanoX/light/continue.lottie";
import NanoXPairingDark from "../animations/device/nanoX/dark/pairing.lottie";
import NanoXPairingLight from "../animations/device/nanoX/light/pairing.lottie";
import NanoXPairedDark from "../animations/device/nanoX/dark/paired.lottie";
import NanoXPairedLight from "../animations/device/nanoX/light/paired.lottie";

import StaxPinDark from "../animations/device/stax/dark/pin.lottie";
import StaxPinLight from "../animations/device/stax/light/pin.lottie";
import StaxContinueDark from "../animations/device/stax/dark/continue.lottie";
import StaxContinueLight from "../animations/device/stax/light/continue.lottie";

import FlexPinDark from "../animations/device/flex/dark/pin.lottie";
import FlexPinLight from "../animations/device/flex/light/pin.lottie";
import FlexContinueDark from "../animations/device/flex/dark/continue.lottie";
import FlexContinueLight from "../animations/device/flex/light/continue.lottie";

import ApexPinDark from "../animations/device/apex/dark/pin.lottie";
import ApexPinLight from "../animations/device/apex/light/pin.lottie";
import ApexContinueDark from "../animations/device/apex/dark/continue.lottie";
import ApexContinueLight from "../animations/device/apex/light/continue.lottie";

import NanoSPlugAndPinCodeDark from "../animations/device/nanoS/1PlugAndPinCode/dark.lottie";
import NanoSPlugAndPinCodeLight from "../animations/device/nanoS/1PlugAndPinCode/light.lottie";
import NanoSEnterPinCodeDark from "../animations/device/nanoS/3EnterPinCode/dark.lottie";
import NanoSEnterPinCodeLight from "../animations/device/nanoS/3EnterPinCode/light.lottie";
import NanoSQuitAppDark from "../animations/device/nanoS/4QuitApp/dark.lottie";
import NanoSQuitAppLight from "../animations/device/nanoS/4QuitApp/light.lottie";
import NanoSOpenAppDark from "../animations/device/nanoS/6OpenApp/dark.lottie";
import NanoSOpenAppLight from "../animations/device/nanoS/6OpenApp/light.lottie";
import NanoSValidateDark from "../animations/device/nanoS/7Validate/dark.lottie";
import NanoSValidateLight from "../animations/device/nanoS/7Validate/light.lottie";

export type AnimationSource = LottieViewProps["source"];
export type AnimationRecord = Record<"light" | "dark", AnimationSource>;

type NanoSKeys = CommonKeys;
type NanoSPKeys = CommonKeys;
type BlueKeys = CommonKeys;
type NanoXKeys = CommonKeys | BleKeys;
type StaxKeys = CommonKeys | BleKeys;
type FlexKeys = CommonKeys | BleKeys;
type ApexKeys = CommonKeys | BleKeys;

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
  [DeviceModelId.apex]: [...commonKeysArray, ...bleKeysArray],
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
  [DeviceModelId.apex]: ApexKeys;
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
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    allowUpdate: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    blePairing: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
    },
    blePaired: {
      light: StaxContinueLight,
      dark: StaxContinueDark,
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
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    allowUpdate: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    blePairing: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
    blePaired: {
      light: FlexContinueLight,
      dark: FlexContinueDark,
    },
  },
  apex: {
    plugAndPinCode: {
      light: ApexPinLight,
      dark: ApexPinDark,
    },
    enterPinCode: {
      light: ApexPinLight,
      dark: ApexPinDark,
    },
    quitApp: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
    allowManager: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
    openApp: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
    verify: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
    sign: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
    allowUpdate: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
    blePairing: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
    blePaired: {
      light: ApexContinueLight,
      dark: ApexContinueDark,
    },
  },
};

export type GetDeviceAnimationArgs<M extends DeviceModelId = DeviceModelId> = {
  theme?: "light" | "dark";
  modelId: M;
  key: DeviceModelIdToKeys[M];
};

/**
 * Get the animation for a specific device and key
 * @param args - The arguments containing the theme, modelId, and key
 * @returns The animation source for the specified device and key
 */
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

export const getDeviceAnimationStyles = (
  deviceModelId: DeviceModelId,
  override: ViewStyle = {},
) => {
  switch (deviceModelId) {
    case DeviceModelId.nanoSP:
    case DeviceModelId.nanoX:
    case DeviceModelId.stax:
    case DeviceModelId.europa:
    case DeviceModelId.apex:
      return { height: 165, ...override };
    default:
      return {};
  }
};
