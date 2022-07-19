// @flow
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import Config from "react-native-config";

const animations = {
  nanoS: {
    plugAndPinCode: {
      light: require("../../animations/nanoS/1PlugAndPinCode/light.json"),
      dark: require("../../animations/nanoS/1PlugAndPinCode/dark.json"),
    },
    enterPinCode: {
      light: require("../../animations/nanoS/3EnterPinCode/light.json"),
      dark: require("../../animations/nanoS/3EnterPinCode/dark.json"),
    },
    quitApp: {
      light: require("../../animations/nanoS/4QuitApp/light.json"),
      dark: require("../../animations/nanoS/4QuitApp/dark.json"),
    },
    allowManager: {
      light: require("../../animations/nanoS/5AllowManager/light.json"),
      dark: require("../../animations/nanoS/5AllowManager/dark.json"),
    },
    openApp: {
      light: require("../../animations/nanoS/6OpenApp/light.json"),
      dark: require("../../animations/nanoS/6OpenApp/dark.json"),
    },
    validate: {
      light: require("../../animations/nanoS/7Validate/light.json"),
      dark: require("../../animations/nanoS/7Validate/dark.json"),
    },
  },
  nanoSP: {
    plugAndPinCode: {
      light: require("../../animations/nanoSP/1PlugAndPinCode/light.json"),
      dark: require("../../animations/nanoSP/1PlugAndPinCode/dark.json"),
    },
    enterPinCode: {
      light: require("../../animations/nanoSP/3EnterPinCode/light.json"),
      dark: require("../../animations/nanoSP/3EnterPinCode/dark.json"),
    },
    quitApp: {
      light: require("../../animations/nanoSP/4QuitApp/light.json"),
      dark: require("../../animations/nanoSP/4QuitApp/dark.json"),
    },
    allowManager: {
      light: require("../../animations/nanoSP/5AllowManager/light.json"),
      dark: require("../../animations/nanoSP/5AllowManager/dark.json"),
    },
    openApp: {
      light: require("../../animations/nanoSP/6OpenApp/light.json"),
      dark: require("../../animations/nanoSP/6OpenApp/dark.json"),
    },
    validate: {
      light: require("../../animations/nanoSP/7Validate/light.json"),
      dark: require("../../animations/nanoSP/7Validate/dark.json"),
    },
  },
  nanoX: {
    wired: {
      plugAndPinCode: {
        light: require("../../animations/nanoX/wired/1PlugAndPinCode/light.json"),
        dark: require("../../animations/nanoX/wired/1PlugAndPinCode/dark.json"),
      },
      enterPinCode: {
        light: require("../../animations/nanoX/wired/3EnterPinCode/light.json"),
        dark: require("../../animations/nanoX/wired/3EnterPinCode/dark.json"),
      },
      quitApp: {
        light: require("../../animations/nanoX/wired/4QuitApp/light.json"),
        dark: require("../../animations/nanoX/wired/4QuitApp/dark.json"),
      },
      allowManager: {
        light: require("../../animations/nanoX/wired/5AllowManager/light.json"),
        dark: require("../../animations/nanoX/wired/5AllowManager/dark.json"),
      },
      openApp: {
        light: require("../../animations/nanoX/wired/6OpenApp/light.json"),
        dark: require("../../animations/nanoX/wired/6OpenApp/dark.json"),
      },
      validate: {
        light: require("../../animations/nanoX/wired/7Validate/light.json"),
        dark: require("../../animations/nanoX/wired/7Validate/dark.json"),
      },
    },
    bluetooth: {
      plugAndPinCode: {
        light: require("../../animations/nanoX/bluetooth/1PlugAndPinCode/light.json"),
        dark: require("../../animations/nanoX/bluetooth/1PlugAndPinCode/dark.json"),
      },
      enterPinCode: {
        light: require("../../animations/nanoX/bluetooth/3EnterPinCode/light.json"),
        dark: require("../../animations/nanoX/bluetooth/3EnterPinCode/dark.json"),
      },
      quitApp: {
        light: require("../../animations/nanoX/bluetooth/4QuitApp/light.json"),
        dark: require("../../animations/nanoX/bluetooth/4QuitApp/dark.json"),
      },
      allowManager: {
        light: require("../../animations/nanoX/bluetooth/5AllowManager/light.json"),
        dark: require("../../animations/nanoX/bluetooth/5AllowManager/dark.json"),
      },
      openApp: {
        light: require("../../animations/nanoX/bluetooth/6OpenApp/light.json"),
        dark: require("../../animations/nanoX/bluetooth/6OpenApp/dark.json"),
      },
      validate: {
        light: require("../../animations/nanoX/bluetooth/7Validate/light.json"),
        dark: require("../../animations/nanoX/bluetooth/7Validate/dark.json"),
      },
    },
  },
  blue: {
    plugAndPinCode: {
      light: require("../../animations/blue/1PlugAndPinCode/data.json"),
      dark: require("../../animations/blue/1PlugAndPinCode/data.json"),
    },
    enterPinCode: {
      light: require("../../animations/blue/3EnterPinCode/data.json"),
      dark: require("../../animations/blue/3EnterPinCode/data.json"),
    },
    quitApp: {
      light: require("../../animations/blue/4QuitApp/data.json"),
      dark: require("../../animations/blue/4QuitApp/data.json"),
    },
    allowManager: {
      light: require("../../animations/blue/5AllowManager/data.json"),
      dark: require("../../animations/blue/5AllowManager/data.json"),
    },
    openApp: {
      light: require("../../animations/blue/6OpenApp/data.json"),
      dark: require("../../animations/blue/6OpenApp/data.json"),
    },
    validate: {
      light: require("../../animations/blue/7Validate/data.json"),
      dark: require("../../animations/blue/7Validate/data.json"),
    },
  },
};

export default function getDeviceAnimation({
  theme = "light",
  key,
  device,
}: {
  theme?: "light" | "dark",
  key: string,
  device: Device,
}) {
  const modelId = Config.OVERRIDE_MODEL_ID || device.modelId;
  const wired = Config.OVERRIDE_WIRED || device.wired;

  const animation = ["nanoS", "nanoSP", "blue"].includes(modelId)
    ? animations[modelId][key]
    : animations.nanoX[wired ? "wired" : "bluetooth"][key];
  return animation[theme];
}
