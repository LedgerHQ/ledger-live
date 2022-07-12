// @flow
import type { DeviceModelId } from "@ledgerhq/devices";

/* eslint-disable camelcase */

// NANO S
import NANO_S_LIGHT_plugAndPinCode from "~/renderer/animations/nanoS/1PlugAndPinCode/light.json";
import NANO_S_DARK_plugAndPinCode from "~/renderer/animations/nanoS/1PlugAndPinCode/dark.json";
import NANO_S_LIGHT_enterPinCode from "~/renderer/animations/nanoS/3EnterPinCode/light.json";
import NANO_S_DARK_enterPinCode from "~/renderer/animations/nanoS/3EnterPinCode/dark.json";
import NANO_S_LIGHT_quitApp from "~/renderer/animations/nanoS/4QuitApp/light.json";
import NANO_S_DARK_quitApp from "~/renderer/animations/nanoS/4QuitApp/dark.json";
import NANO_S_LIGHT_allowManager from "~/renderer/animations/nanoS/5AllowManager/light.json";
import NANO_S_DARK_allowManager from "~/renderer/animations/nanoS/5AllowManager/dark.json";
import NANO_S_LIGHT_openApp from "~/renderer/animations/nanoS/6OpenApp/light.json";
import NANO_S_DARK_openApp from "~/renderer/animations/nanoS/6OpenApp/dark.json";
import NANO_S_LIGHT_validate from "~/renderer/animations/nanoS/7Validate/light.json";
import NANO_S_DARK_validate from "~/renderer/animations/nanoS/7Validate/dark.json";
import NANO_S_LIGHT_firmwareUpdating from "~/renderer/animations/nanoS/2FirmwareUpdating/light.json";
import NANO_S_DARK_firmwareUpdating from "~/renderer/animations/nanoS/2FirmwareUpdating/dark.json";
import NANO_S_LIGHT_installLoading from "~/renderer/animations/nanoS/8InstallLoading/light.json";
import NANO_S_DARK_installLoading from "~/renderer/animations/nanoS/8InstallLoading/dark.json";

// NANO X
import NANO_X_LIGHT_plugAndPinCode from "~/renderer/animations/nanoX/1PlugAndPinCode/light.json";
import NANO_X_DARK_plugAndPinCode from "~/renderer/animations/nanoX/1PlugAndPinCode/dark.json";
import NANO_X_LIGHT_enterPinCode from "~/renderer/animations/nanoX/3EnterPinCode/light.json";
import NANO_X_DARK_enterPinCode from "~/renderer/animations/nanoX/3EnterPinCode/dark.json";
import NANO_X_LIGHT_quitApp from "~/renderer/animations/nanoX/4QuitApp/light.json";
import NANO_X_DARK_quitApp from "~/renderer/animations/nanoX/4QuitApp/dark.json";
import NANO_X_LIGHT_allowManager from "~/renderer/animations/nanoX/5AllowManager/light.json";
import NANO_X_DARK_allowManager from "~/renderer/animations/nanoX/5AllowManager/dark.json";
import NANO_X_LIGHT_openApp from "~/renderer/animations/nanoX/6OpenApp/light.json";
import NANO_X_DARK_openApp from "~/renderer/animations/nanoX/6OpenApp/dark.json";
import NANO_X_LIGHT_validate from "~/renderer/animations/nanoX/7Validate/light.json";
import NANO_X_DARK_validate from "~/renderer/animations/nanoX/7Validate/dark.json";
import NANO_X_LIGHT_firmwareUpdating from "~/renderer/animations/nanoX/2FirmwareUpdating/light.json";
import NANO_X_DARK_firmwareUpdating from "~/renderer/animations/nanoX/2FirmwareUpdating/dark.json";
import NANO_X_LIGHT_installLoading from "~/renderer/animations/nanoX/8InstallLoading/light.json";
import NANO_X_DARK_installLoading from "~/renderer/animations/nanoX/8InstallLoading/dark.json";

// NANO SP
import NANO_SP_LIGHT_plugAndPinCode from "~/renderer/animations/nanoSP/1PlugAndPinCode/light.json";
import NANO_SP_DARK_plugAndPinCode from "~/renderer/animations/nanoSP/1PlugAndPinCode/dark.json";
import NANO_SP_LIGHT_enterPinCode from "~/renderer/animations/nanoSP/3EnterPinCode/light.json";
import NANO_SP_DARK_enterPinCode from "~/renderer/animations/nanoSP/3EnterPinCode/dark.json";
import NANO_SP_LIGHT_quitApp from "~/renderer/animations/nanoSP/4QuitApp/light.json";
import NANO_SP_DARK_quitApp from "~/renderer/animations/nanoSP/4QuitApp/dark.json";
import NANO_SP_LIGHT_allowManager from "~/renderer/animations/nanoSP/5AllowManager/light.json";
import NANO_SP_DARK_allowManager from "~/renderer/animations/nanoSP/5AllowManager/dark.json";
import NANO_SP_LIGHT_openApp from "~/renderer/animations/nanoSP/6OpenApp/light.json";
import NANO_SP_DARK_openApp from "~/renderer/animations/nanoSP/6OpenApp/dark.json";
import NANO_SP_LIGHT_validate from "~/renderer/animations/nanoSP/7Validate/light.json";
import NANO_SP_DARK_validate from "~/renderer/animations/nanoSP/7Validate/dark.json";
import NANO_SP_LIGHT_firmwareUpdating from "~/renderer/animations/nanoSP/2FirmwareUpdating/light.json";
import NANO_SP_DARK_firmwareUpdating from "~/renderer/animations/nanoSP/2FirmwareUpdating/dark.json";
import NANO_SP_LIGHT_installLoading from "~/renderer/animations/nanoSP/8InstallLoading/light.json";
import NANO_SP_DARK_installLoading from "~/renderer/animations/nanoSP/8InstallLoading/dark.json";

// NANO BLUE

import BLUE_LIGHT_plugAndPinCode from "~/renderer/animations/blue/1PlugAndPinCode/data.json";
import BLUE_LIGHT_enterPinCode from "~/renderer/animations/blue/3EnterPinCode/data.json";
import BLUE_LIGHT_quitApp from "~/renderer/animations/blue/4QuitApp/data.json";
import BLUE_LIGHT_allowManager from "~/renderer/animations/blue/5AllowManager/data.json";
import BLUE_LIGHT_openApp from "~/renderer/animations/blue/6OpenApp/data.json";
import BLUE_LIGHT_validate from "~/renderer/animations/blue/7Validate/data.json";

// NANO FTS

import NANO_FTS_LIGHT_plugAndPinCode from "~/renderer/animations/nanoFTS/1PlugAndPinCode/light.json";
import NANO_FTS_DARK_plugAndPinCode from "~/renderer/animations/nanoFTS/1PlugAndPinCode/dark.json";
import NANO_FTS_LIGHT_enterPinCode from "~/renderer/animations/nanoFTS/3EnterPinCode/light.json";
import NANO_FTS_DARK_enterPinCode from "~/renderer/animations/nanoFTS/3EnterPinCode/dark.json";
import NANO_FTS_LIGHT_quitApp from "~/renderer/animations/nanoFTS/4QuitApp/light.json";
import NANO_FTS_DARK_quitApp from "~/renderer/animations/nanoFTS/4QuitApp/dark.json";
import NANO_FTS_LIGHT_allowManager from "~/renderer/animations/nanoFTS/5AllowManager/light.json";
import NANO_FTS_DARK_allowManager from "~/renderer/animations/nanoFTS/5AllowManager/dark.json";
import NANO_FTS_LIGHT_openApp from "~/renderer/animations/nanoFTS/6OpenApp/light.json";
import NANO_FTS_DARK_openApp from "~/renderer/animations/nanoFTS/6OpenApp/dark.json";
import NANO_FTS_LIGHT_validate from "~/renderer/animations/nanoFTS/7Validate/light.json";
import NANO_FTS_DARK_validate from "~/renderer/animations/nanoFTS/7Validate/dark.json";
import NANO_FTS_LIGHT_firmwareUpdating from "~/renderer/animations/nanoFTS/2FirmwareUpdating/light.json";
import NANO_FTS_DARK_firmwareUpdating from "~/renderer/animations/nanoFTS/2FirmwareUpdating/dark.json";
import NANO_FTS_LIGHT_installLoading from "~/renderer/animations/nanoFTS/8InstallLoading/light.json";
import NANO_FTS_DARK_installLoading from "~/renderer/animations/nanoFTS/8InstallLoading/dark.json";
import NANO_FTS_LIGHT_pairingProgress from "~/renderer/animations/nanoFTS/9PairingProgress/light.json";
import NANO_FTS_DARK_pairingProgress from "~/renderer/animations/nanoFTS/9PairingProgress/dark.json";
import NANO_FTS_LIGHT_pairingSuccess from "~/renderer/animations/nanoFTS/10PairingSuccess/light.json";
import NANO_FTS_DARK_pairingSuccess from "~/renderer/animations/nanoFTS/10PairingSuccess/dark.json";
import NANO_FTS_LIGHT_placeHolder from "~/renderer/animations/nanoFTS/11PlaceHolder/light.json";
import NANO_FTS_DARK_placeHolder from "~/renderer/animations/nanoFTS/11PlaceHolder/dark.json";

/* eslint-enable camelcase */

const nanoS = {
  plugAndPinCode: {
    light: NANO_S_LIGHT_plugAndPinCode,
    dark: NANO_S_DARK_plugAndPinCode,
  },
  enterPinCode: {
    light: NANO_S_LIGHT_enterPinCode,
    dark: NANO_S_DARK_enterPinCode,
  },
  quitApp: {
    light: NANO_S_LIGHT_quitApp,
    dark: NANO_S_DARK_quitApp,
  },
  allowManager: {
    light: NANO_S_LIGHT_allowManager,
    dark: NANO_S_DARK_allowManager,
  },
  openApp: {
    light: NANO_S_LIGHT_openApp,
    dark: NANO_S_DARK_openApp,
  },
  validate: {
    light: NANO_S_LIGHT_validate,
    dark: NANO_S_DARK_validate,
  },
  firmwareUpdating: {
    light: NANO_S_LIGHT_firmwareUpdating,
    dark: NANO_S_DARK_firmwareUpdating,
  },
  installLoading: {
    light: NANO_S_LIGHT_installLoading,
    dark: NANO_S_DARK_installLoading,
  },
};
const nanoX = {
  plugAndPinCode: {
    light: NANO_X_LIGHT_plugAndPinCode,
    dark: NANO_X_DARK_plugAndPinCode,
  },
  enterPinCode: {
    light: NANO_X_LIGHT_enterPinCode,
    dark: NANO_X_DARK_enterPinCode,
  },
  quitApp: {
    light: NANO_X_LIGHT_quitApp,
    dark: NANO_X_DARK_quitApp,
  },
  allowManager: {
    light: NANO_X_LIGHT_allowManager,
    dark: NANO_X_DARK_allowManager,
  },
  openApp: {
    light: NANO_X_LIGHT_openApp,
    dark: NANO_X_DARK_openApp,
  },
  validate: {
    light: NANO_X_LIGHT_validate,
    dark: NANO_X_DARK_validate,
  },
  firmwareUpdating: {
    light: NANO_X_LIGHT_firmwareUpdating,
    dark: NANO_X_DARK_firmwareUpdating,
  },
  installLoading: {
    light: NANO_X_LIGHT_installLoading,
    dark: NANO_X_DARK_installLoading,
  },
};

const nanoSP = {
  plugAndPinCode: {
    light: NANO_SP_LIGHT_plugAndPinCode,
    dark: NANO_SP_DARK_plugAndPinCode,
  },
  enterPinCode: {
    light: NANO_SP_LIGHT_enterPinCode,
    dark: NANO_SP_DARK_enterPinCode,
  },
  quitApp: {
    light: NANO_SP_LIGHT_quitApp,
    dark: NANO_SP_DARK_quitApp,
  },
  allowManager: {
    light: NANO_SP_LIGHT_allowManager,
    dark: NANO_SP_DARK_allowManager,
  },
  openApp: {
    light: NANO_SP_LIGHT_openApp,
    dark: NANO_SP_DARK_openApp,
  },
  validate: {
    light: NANO_SP_LIGHT_validate,
    dark: NANO_SP_DARK_validate,
  },
  firmwareUpdating: {
    light: NANO_SP_LIGHT_firmwareUpdating,
    dark: NANO_SP_DARK_firmwareUpdating,
  },
  installLoading: {
    light: NANO_SP_LIGHT_installLoading,
    dark: NANO_SP_DARK_installLoading,
  },
};

const nanoFTS = {
  plugAndPinCode: {
    light: NANO_FTS_LIGHT_plugAndPinCode,
    dark: NANO_FTS_DARK_plugAndPinCode,
  },
  enterPinCode: {
    light: NANO_FTS_LIGHT_enterPinCode,
    dark: NANO_FTS_DARK_enterPinCode,
  },
  quitApp: {
    light: NANO_FTS_LIGHT_quitApp,
    dark: NANO_FTS_DARK_quitApp,
  },
  allowManager: {
    light: NANO_FTS_LIGHT_allowManager,
    dark: NANO_FTS_DARK_allowManager,
  },
  openApp: {
    light: NANO_FTS_LIGHT_openApp,
    dark: NANO_FTS_DARK_openApp,
  },
  validate: {
    light: NANO_FTS_LIGHT_validate,
    dark: NANO_FTS_DARK_validate,
  },
  firmwareUpdating: {
    light: NANO_FTS_LIGHT_firmwareUpdating,
    dark: NANO_FTS_DARK_firmwareUpdating,
  },
  installLoading: {
    light: NANO_FTS_LIGHT_installLoading,
    dark: NANO_FTS_DARK_installLoading,
  },
  pairingProgress: {
    light: NANO_FTS_LIGHT_pairingProgress,
    dark: NANO_FTS_DARK_pairingProgress,
  },
  pairingSuccess: {
    light: NANO_FTS_LIGHT_pairingSuccess,
    dark: NANO_FTS_DARK_pairingSuccess,
  },
  placeHolder: {
    light: NANO_FTS_LIGHT_placeHolder,
    dark: NANO_FTS_DARK_placeHolder,
  },
};

const blue = {
  plugAndPinCode: {
    light: BLUE_LIGHT_plugAndPinCode,
  },
  enterPinCode: {
    light: BLUE_LIGHT_enterPinCode,
  },
  quitApp: {
    light: BLUE_LIGHT_quitApp,
  },
  allowManager: {
    light: BLUE_LIGHT_allowManager,
  },
  openApp: {
    light: BLUE_LIGHT_openApp,
  },
  validate: {
    light: BLUE_LIGHT_validate,
  },
  // Nb We are dropping the assets for blue soon, this is temp
  firmwareUpdating: {
    light: NANO_S_LIGHT_firmwareUpdating,
    dark: NANO_S_DARK_firmwareUpdating,
  },
  installLoading: {
    light: NANO_S_LIGHT_installLoading,
    dark: NANO_S_DARK_installLoading,
  },
};

const animations = { nanoX, nanoS, nanoSP, nanoFTS, blue };

type InferredKeys = $Keys<typeof nanoS>;

export const getDeviceAnimation = (
  modelId: DeviceModelId,
  theme: "light" | "dark",
  key: InferredKeys,
) => {
  // $FlowFixMe Ignore the type to allow override from env.
  modelId = process.env.OVERRIDE_MODEL_ID || modelId;
  const lvl1 = animations[modelId] || animations.nanoX;
  const lvl2 = lvl1[key] || animations.nanoX[key];
  if (theme === "dark" && lvl2.dark) return lvl2.dark;
  return lvl2.light;
};
