import { DeviceModelId } from "@ledgerhq/types-devices";
import type { LottieViewProps } from "lottie-react-native";
import { ViewStyle } from "react-native";

import { resolveLottieAsset } from "~/utils/lottieAsset";

const BluePlugAndPinCode = resolveLottieAsset(
  require("../animations/device/blue/1PlugAndPinCode/data.lottie.json"),
);
const BlueEnterPinCode = resolveLottieAsset(
  require("../animations/device/blue/3EnterPinCode/data.lottie.json"),
);
const BlueQuitApp = resolveLottieAsset(
  require("../animations/device/blue/4QuitApp/data.lottie.json"),
);
const BlueAllowManager = resolveLottieAsset(
  require("../animations/device/blue/5AllowManager/data.lottie.json"),
);
const BlueOpenApp = resolveLottieAsset(
  require("../animations/device/blue/6OpenApp/data.lottie.json"),
);
const BlueValidate = resolveLottieAsset(
  require("../animations/device/blue/7Validate/data.lottie.json"),
);

const NanoSPPinDark = resolveLottieAsset(
  require("../animations/device/nanoSP/dark/pin.lottie.json"),
);
const NanoSPPinLight = resolveLottieAsset(
  require("../animations/device/nanoSP/light/pin.lottie.json"),
);
const NanoSPContinueDark = resolveLottieAsset(
  require("../animations/device/nanoSP/dark/continue.lottie.json"),
);
const NanoSPContinueLight = resolveLottieAsset(
  require("../animations/device/nanoSP/light/continue.lottie.json"),
);

const NanoXPinDark = resolveLottieAsset(require("../animations/device/nanoX/dark/pin.lottie.json"));
const NanoXPinLight = resolveLottieAsset(
  require("../animations/device/nanoX/light/pin.lottie.json"),
);
const NanoXContinueDark = resolveLottieAsset(
  require("../animations/device/nanoX/dark/continue.lottie.json"),
);
const NanoXContinueLight = resolveLottieAsset(
  require("../animations/device/nanoX/light/continue.lottie.json"),
);
const NanoXPairingDark = resolveLottieAsset(
  require("../animations/device/nanoX/dark/pairing.lottie.json"),
);
const NanoXPairingLight = resolveLottieAsset(
  require("../animations/device/nanoX/light/pairing.lottie.json"),
);
const NanoXPairedDark = resolveLottieAsset(
  require("../animations/device/nanoX/dark/paired.lottie.json"),
);
const NanoXPairedLight = resolveLottieAsset(
  require("../animations/device/nanoX/light/paired.lottie.json"),
);

const StaxPinDark = resolveLottieAsset(require("../animations/device/stax/dark/pin.lottie.json"));
const StaxPinLight = resolveLottieAsset(require("../animations/device/stax/light/pin.lottie.json"));
const StaxContinueDark = resolveLottieAsset(
  require("../animations/device/stax/dark/continue.lottie.json"),
);
const StaxContinueLight = resolveLottieAsset(
  require("../animations/device/stax/light/continue.lottie.json"),
);

const FlexPinDark = resolveLottieAsset(require("../animations/device/flex/dark/pin.lottie.json"));
const FlexPinLight = resolveLottieAsset(require("../animations/device/flex/light/pin.lottie.json"));
const FlexContinueDark = resolveLottieAsset(
  require("../animations/device/flex/dark/continue.lottie.json"),
);
const FlexContinueLight = resolveLottieAsset(
  require("../animations/device/flex/light/continue.lottie.json"),
);

const ApexPinDark = resolveLottieAsset(require("../animations/device/apex/dark/pin.lottie.json"));
const ApexPinLight = resolveLottieAsset(require("../animations/device/apex/light/pin.lottie.json"));
const ApexContinueDark = resolveLottieAsset(
  require("../animations/device/apex/dark/continue.lottie.json"),
);
const ApexContinueLight = resolveLottieAsset(
  require("../animations/device/apex/light/continue.lottie.json"),
);

const NanoSPlugAndPinCodeDark = resolveLottieAsset(
  require("../animations/device/nanoS/1PlugAndPinCode/dark.lottie.json"),
);
const NanoSPlugAndPinCodeLight = resolveLottieAsset(
  require("../animations/device/nanoS/1PlugAndPinCode/light.lottie.json"),
);
const NanoSEnterPinCodeDark = resolveLottieAsset(
  require("../animations/device/nanoS/3EnterPinCode/dark.lottie.json"),
);
const NanoSEnterPinCodeLight = resolveLottieAsset(
  require("../animations/device/nanoS/3EnterPinCode/light.lottie.json"),
);
const NanoSQuitAppDark = resolveLottieAsset(
  require("../animations/device/nanoS/4QuitApp/dark.lottie.json"),
);
const NanoSQuitAppLight = resolveLottieAsset(
  require("../animations/device/nanoS/4QuitApp/light.lottie.json"),
);
const NanoSOpenAppDark = resolveLottieAsset(
  require("../animations/device/nanoS/6OpenApp/dark.lottie.json"),
);
const NanoSOpenAppLight = resolveLottieAsset(
  require("../animations/device/nanoS/6OpenApp/light.lottie.json"),
);
const NanoSValidateDark = resolveLottieAsset(
  require("../animations/device/nanoS/7Validate/dark.lottie.json"),
);
const NanoSValidateLight = resolveLottieAsset(
  require("../animations/device/nanoS/7Validate/light.lottie.json"),
);

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
