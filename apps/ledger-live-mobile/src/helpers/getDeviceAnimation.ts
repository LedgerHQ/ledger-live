import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import Config from "react-native-config";

const animations: { [modelId in DeviceModelId]: any } = {
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
    validate: {
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
    validate: {
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
    validate: {
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
      validate: {
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
      validate: {
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
  nanoFTS: {
    wired: {
      plugAndPinCode: {
        light: require("../animations/nanoFTS/1PlugAndPinCode/light.json"),
        dark: require("../animations/nanoFTS/1PlugAndPinCode/dark.json"),
      },
      enterPinCode: {
        light: require("../animations/nanoFTS/3EnterPinCode/light.json"),
        dark: require("../animations/nanoFTS/3EnterPinCode/dark.json"),
      },
      quitApp: {
        light: require("../animations/nanoFTS/4QuitApp/light.json"),
        dark: require("../animations/nanoFTS/4QuitApp/dark.json"),
      },
      allowManager: {
        light: require("../animations/nanoFTS/5AllowManager/light.json"),
        dark: require("../animations/nanoFTS/5AllowManager/dark.json"),
      },
      openApp: {
        light: require("../animations/nanoFTS/6OpenApp/light.json"),
        dark: require("../animations/nanoFTS/6OpenApp/dark.json"),
      },
      validate: {
        light: require("../animations/nanoFTS/7Validate/light.json"),
        dark: require("../animations/nanoFTS/7Validate/dark.json"),
      },
    },
    bluetooth: {
      plugAndPinCode: {
        light: require("../animations/nanoFTS/1PlugAndPinCode/light.json"),
        dark: require("../animations/nanoFTS/1PlugAndPinCode/dark.json"),
      },
      enterPinCode: {
        light: require("../animations/nanoFTS/3EnterPinCode/light.json"),
        dark: require("../animations/nanoFTS/3EnterPinCode/dark.json"),
      },
      quitApp: {
        light: require("../animations/nanoFTS/4QuitApp/light.json"),
        dark: require("../animations/nanoFTS/4QuitApp/dark.json"),
      },
      allowManager: {
        light: require("../animations/nanoFTS/5AllowManager/light.json"),
        dark: require("../animations/nanoFTS/5AllowManager/dark.json"),
      },
      openApp: {
        light: require("../animations/nanoFTS/6OpenApp/light.json"),
        dark: require("../animations/nanoFTS/6OpenApp/dark.json"),
      },
      validate: {
        light: require("../animations/nanoFTS/7Validate/light.json"),
        dark: require("../animations/nanoFTS/7Validate/dark.json"),
      },
      blePairing: {
        light: require("../animations/nanoFTS/BlePairing/light.json"),
        dark: require("../animations/nanoFTS/BlePairing/dark.json"),
      },
      blePaired: {
        light: require("../animations/nanoFTS/BlePaired/light.json"),
        dark: require("../animations/nanoFTS/BlePaired/dark.json"),
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
}: GetDeviceAnimationArgs) {
  const modelId = (Config.OVERRIDE_MODEL_ID as DeviceModelId) || device.modelId;
  const wired = Config.OVERRIDE_WIRED || device.wired;

  let animation;

  if (
    [DeviceModelId.nanoS, DeviceModelId.nanoSP, DeviceModelId.blue].includes(
      modelId,
    )
  ) {
    animation = animations[modelId][key][theme];
  } else {
    animation =
      animations[modelId]?.[wired ? "wired" : "bluetooth"]?.[key][theme];
  }

  if (!animation) {
    console.error(`No animation for ${modelId} ${key}`);
    return null;
  }

  return animation;
}
