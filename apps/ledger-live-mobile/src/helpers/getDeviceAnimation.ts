import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { AnimatedLottieViewProps } from "lottie-react-native";
import Config from "react-native-config";

type Animation = AnimatedLottieViewProps["source"];
type AnimationRecord = Record<"light" | "dark", Animation>;
type S_SP_BLUE =
  | DeviceModelId.nanoS
  | DeviceModelId.nanoSP
  | DeviceModelId.blue;
export type Animations = {
  [modelId in S_SP_BLUE]: Record<string, AnimationRecord>;
} & {
  [modelId in DeviceModelId]: Record<string, Record<string, AnimationRecord>>;
};

const animations: Animations = {
  nanoS: {
    plugAndPinCode: {
      light: require("../animations/nanoS/1PlugAndPinCode/light.json"),
      dark: require("../animations/nanoS/1PlugAndPinCode/dark.json"),
    },
    enterPinCode: {
      light: require("../animations/nanoS/3EnterPinCode/light.json"),
      dark: require("../animations/nanoS/3EnterPinCode/dark.json"),
    },
    quitApp: {
      light: require("../animations/nanoS/4QuitApp/light.json"),
      dark: require("../animations/nanoS/4QuitApp/dark.json"),
    },
    allowManager: {
      light: require("../animations/nanoS/5AllowManager/light.json"),
      dark: require("../animations/nanoS/5AllowManager/dark.json"),
    },
    openApp: {
      light: require("../animations/nanoS/6OpenApp/light.json"),
      dark: require("../animations/nanoS/6OpenApp/dark.json"),
    },
    verify: {
      light: require("../animations/nanoS/7Validate/light.json"),
      dark: require("../animations/nanoS/7Validate/dark.json"),
    },
    sign: {
      light: require("../animations/nanoS/7Validate/light.json"),
      dark: require("../animations/nanoS/7Validate/dark.json"),
    },
    allowUpdate: {
      light: require("../animations/nanoS/7Validate/light.json"),
      dark: require("../animations/nanoS/7Validate/dark.json"),
    },
  },
  nanoSP: {
    plugAndPinCode: {
      light: require("../animations/nanoSP/1PlugAndPinCode/light.json"),
      dark: require("../animations/nanoSP/1PlugAndPinCode/dark.json"),
    },
    enterPinCode: {
      light: require("../animations/nanoSP/3EnterPinCode/light.json"),
      dark: require("../animations/nanoSP/3EnterPinCode/dark.json"),
    },
    quitApp: {
      light: require("../animations/nanoSP/4QuitApp/light.json"),
      dark: require("../animations/nanoSP/4QuitApp/dark.json"),
    },
    allowManager: {
      light: require("../animations/nanoSP/5AllowManager/light.json"),
      dark: require("../animations/nanoSP/5AllowManager/dark.json"),
    },
    openApp: {
      light: require("../animations/nanoSP/6OpenApp/light.json"),
      dark: require("../animations/nanoSP/6OpenApp/dark.json"),
    },
    verify: {
      light: require("../animations/nanoSP/7Validate/light.json"),
      dark: require("../animations/nanoSP/7Validate/dark.json"),
    },
    sign: {
      light: require("../animations/nanoSP/7Validate/light.json"),
      dark: require("../animations/nanoSP/7Validate/dark.json"),
    },
    allowUpdate: {
      light: require("../animations/nanoSP/7Validate/light.json"),
      dark: require("../animations/nanoSP/7Validate/dark.json"),
    },
  },
  blue: {
    plugAndPinCode: {
      light: require("../animations/blue/1PlugAndPinCode/data.json"),
      dark: require("../animations/blue/1PlugAndPinCode/data.json"),
    },
    enterPinCode: {
      light: require("../animations/blue/3EnterPinCode/data.json"),
      dark: require("../animations/blue/3EnterPinCode/data.json"),
    },
    quitApp: {
      light: require("../animations/blue/4QuitApp/data.json"),
      dark: require("../animations/blue/4QuitApp/data.json"),
    },
    allowManager: {
      light: require("../animations/blue/5AllowManager/data.json"),
      dark: require("../animations/blue/5AllowManager/data.json"),
    },
    openApp: {
      light: require("../animations/blue/6OpenApp/data.json"),
      dark: require("../animations/blue/6OpenApp/data.json"),
    },
    verify: {
      light: require("../animations/blue/7Validate/data.json"),
      dark: require("../animations/blue/7Validate/data.json"),
    },
    sign: {
      light: require("../animations/blue/7Validate/data.json"),
      dark: require("../animations/blue/7Validate/data.json"),
    },
    allowUpdate: {
      light: require("../animations/blue/7Validate/data.json"),
      dark: require("../animations/blue/7Validate/data.json"),
    },
  },
  nanoX: {
    wired: {
      plugAndPinCode: {
        light: require("../animations/nanoX/wired/1PlugAndPinCode/light.json"),
        dark: require("../animations/nanoX/wired/1PlugAndPinCode/dark.json"),
      },
      enterPinCode: {
        light: require("../animations/nanoX/wired/3EnterPinCode/light.json"),
        dark: require("../animations/nanoX/wired/3EnterPinCode/dark.json"),
      },
      quitApp: {
        light: require("../animations/nanoX/wired/4QuitApp/light.json"),
        dark: require("../animations/nanoX/wired/4QuitApp/dark.json"),
      },
      allowManager: {
        light: require("../animations/nanoX/wired/5AllowManager/light.json"),
        dark: require("../animations/nanoX/wired/5AllowManager/dark.json"),
      },
      openApp: {
        light: require("../animations/nanoX/wired/6OpenApp/light.json"),
        dark: require("../animations/nanoX/wired/6OpenApp/dark.json"),
      },
      verify: {
        light: require("../animations/nanoX/wired/7Validate/light.json"),
        dark: require("../animations/nanoX/wired/7Validate/dark.json"),
      },
      sign: {
        light: require("../animations/nanoX/wired/7Validate/light.json"),
        dark: require("../animations/nanoX/wired/7Validate/dark.json"),
      },
      allowUpdate: {
        light: require("../animations/nanoX/wired/7Validate/light.json"),
        dark: require("../animations/nanoX/wired/7Validate/dark.json"),
      },
    },
    bluetooth: {
      plugAndPinCode: {
        light: require("../animations/nanoX/bluetooth/1PlugAndPinCode/light.json"),
        dark: require("../animations/nanoX/bluetooth/1PlugAndPinCode/dark.json"),
      },
      enterPinCode: {
        light: require("../animations/nanoX/bluetooth/3EnterPinCode/light.json"),
        dark: require("../animations/nanoX/bluetooth/3EnterPinCode/dark.json"),
      },
      quitApp: {
        light: require("../animations/nanoX/bluetooth/4QuitApp/light.json"),
        dark: require("../animations/nanoX/bluetooth/4QuitApp/dark.json"),
      },
      allowManager: {
        light: require("../animations/nanoX/bluetooth/5AllowManager/light.json"),
        dark: require("../animations/nanoX/bluetooth/5AllowManager/dark.json"),
      },
      openApp: {
        light: require("../animations/nanoX/bluetooth/6OpenApp/light.json"),
        dark: require("../animations/nanoX/bluetooth/6OpenApp/dark.json"),
      },
      verify: {
        light: require("../animations/nanoX/bluetooth/7Validate/light.json"),
        dark: require("../animations/nanoX/bluetooth/7Validate/dark.json"),
      },
      sign: {
        light: require("../animations/nanoX/bluetooth/7Validate/light.json"),
        dark: require("../animations/nanoX/bluetooth/7Validate/dark.json"),
      },
      allowUpdate: {
        light: require("../animations/nanoX/bluetooth/7Validate/light.json"),
        dark: require("../animations/nanoX/bluetooth/7Validate/dark.json"),
      },
      blePairing: {
        light: require("../animations/nanoX/BlePairing/light.json"),
        dark: require("../animations/nanoX/BlePairing/dark.json"),
      },
      blePaired: {
        light: require("../animations/nanoX/BlePaired/light.json"),
        dark: require("../animations/nanoX/BlePaired/dark.json"),
      },
    },
  },
  stax: {
    wired: {
      plugAndPinCode: {
        light: require("../animations/stax/enterPIN.json"),
        dark: require("../animations/stax/enterPIN.json"),
      },
      enterPinCode: {
        light: require("../animations/stax/enterPIN.json"),
        dark: require("../animations/stax/enterPIN.json"),
      },
      quitApp: {
        light: require("../animations/stax/allowConnection.json"),
        dark: require("../animations/stax/allowConnection.json"),
      },
      allowManager: {
        light: require("../animations/stax/allowConnection.json"),
        dark: require("../animations/stax/allowConnection.json"),
      },
      openApp: {
        light: require("../animations/stax/allowConnection.json"),
        dark: require("../animations/stax/allowConnection.json"),
      },
      verify: {
        light: require("../animations/stax/verifyAddress.json"),
        dark: require("../animations/stax/verifyAddress.json"),
      },
      sign: {
        light: require("../animations/stax/signTransaction.json"),
        dark: require("../animations/stax/signTransaction.json"),
      },
      allowUpdate: {
        light: require("../animations/stax/allowConnection.json"),
        dark: require("../animations/stax/allowConnection.json"),
      },
    },
    bluetooth: {
      plugAndPinCode: {
        light: require("../animations/stax/enterPIN.json"),
        dark: require("../animations/stax/enterPIN.json"),
      },
      enterPinCode: {
        light: require("../animations/stax/enterPIN.json"),
        dark: require("../animations/stax/enterPIN.json"),
      },
      quitApp: {
        light: require("../animations/stax/allowConnection.json"),
        dark: require("../animations/stax/allowConnection.json"),
      },
      allowManager: {
        light: require("../animations/stax/allowConnection.json"),
        dark: require("../animations/stax/allowConnection.json"),
      },
      openApp: {
        light: require("../animations/stax/allowConnection.json"),
        dark: require("../animations/stax/allowConnection.json"),
      },
      verify: {
        light: require("../animations/stax/verifyAddress.json"),
        dark: require("../animations/stax/verifyAddress.json"),
      },
      sign: {
        light: require("../animations/stax/signTransaction.json"),
        dark: require("../animations/stax/signTransaction.json"),
      },
      allowUpdate: {
        light: require("../animations/stax/allowConnection.json"),
        dark: require("../animations/stax/allowConnection.json"),
      },
      blePairing: {
        light: require("../animations/stax/pairingProgress.json"),
        dark: require("../animations/stax/pairingProgress.json"),
      },
      blePaired: {
        light: require("../animations/stax/pairingSuccess.json"),
        dark: require("../animations/stax/pairingSuccess.json"),
      },
    },
  },
};

export type GetDeviceAnimationArgs = {
  theme?: "light" | "dark";
  key: string;
  device: Device;
};

// Return an animation associated to a device
export function getDeviceAnimation({
  theme = "light",
  key,
  device,
}: GetDeviceAnimationArgs): AnimatedLottieViewProps["source"] {
  const modelId = (Config.OVERRIDE_MODEL_ID as DeviceModelId) || device.modelId;
  const wired = Config.OVERRIDE_WIRED || device.wired;

  let animation: Animation | undefined;

  if (
    [DeviceModelId.nanoS, DeviceModelId.nanoSP, DeviceModelId.blue].includes(
      modelId,
    )
  ) {
    animation = animations[modelId as S_SP_BLUE][key][theme];
  } else {
    animation =
      animations[modelId]?.[wired ? "wired" : "bluetooth"]?.[key][theme];
  }

  if (!animation) {
    console.error(`No animation for ${modelId} ${key}`);
    // @ts-expect-error Halp :()
    return undefined;
  }

  return animation;
}
