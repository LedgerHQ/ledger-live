/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable camelcase */
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Theme } from "@ledgerhq/react-ui";

// NANO S
// @ts-ignore
import NANO_S_LIGHT_plugAndPinCode from "~/renderer/animations/nanoS/1PlugAndPinCode/light.json";
// @ts-ignore
import NANO_S_DARK_plugAndPinCode from "~/renderer/animations/nanoS/1PlugAndPinCode/dark.json";
// @ts-ignore
import NANO_S_LIGHT_enterPinCode from "~/renderer/animations/nanoS/3EnterPinCode/light.json";
// @ts-ignore
import NANO_S_DARK_enterPinCode from "~/renderer/animations/nanoS/3EnterPinCode/dark.json";
// @ts-ignore
import NANO_S_LIGHT_quitApp from "~/renderer/animations/nanoS/4QuitApp/light.json";
// @ts-ignore
import NANO_S_DARK_quitApp from "~/renderer/animations/nanoS/4QuitApp/dark.json";
// @ts-ignore
import NANO_S_LIGHT_allowManager from "~/renderer/animations/nanoS/5AllowManager/light.json";
// @ts-ignore
import NANO_S_DARK_allowManager from "~/renderer/animations/nanoS/5AllowManager/dark.json";
// @ts-ignore
import NANO_S_LIGHT_openApp from "~/renderer/animations/nanoS/6OpenApp/light.json";
// @ts-ignore
import NANO_S_DARK_openApp from "~/renderer/animations/nanoS/6OpenApp/dark.json";
// @ts-ignore
import NANO_S_LIGHT_validate from "~/renderer/animations/nanoS/7Validate/light.json";
// @ts-ignore
import NANO_S_DARK_validate from "~/renderer/animations/nanoS/7Validate/dark.json";
// @ts-ignore
import NANO_S_LIGHT_firmwareUpdating from "~/renderer/animations/nanoS/2FirmwareUpdating/light.json";
// @ts-ignore
import NANO_S_DARK_firmwareUpdating from "~/renderer/animations/nanoS/2FirmwareUpdating/dark.json";
// @ts-ignore
import NANO_S_LIGHT_installLoading from "~/renderer/animations/nanoS/8InstallLoading/light.json";
// @ts-ignore
import NANO_S_DARK_installLoading from "~/renderer/animations/nanoS/8InstallLoading/dark.json";

// NANO X
// @ts-ignore
import NANO_X_LIGHT_plugAndPinCode from "~/renderer/animations/nanoX/1PlugAndPinCode/light.json";
// @ts-ignore
import NANO_X_DARK_plugAndPinCode from "~/renderer/animations/nanoX/1PlugAndPinCode/dark.json";
// @ts-ignore
import NANO_X_LIGHT_enterPinCode from "~/renderer/animations/nanoX/3EnterPinCode/light.json";
// @ts-ignore
import NANO_X_DARK_enterPinCode from "~/renderer/animations/nanoX/3EnterPinCode/dark.json";
// @ts-ignore
import NANO_X_LIGHT_quitApp from "~/renderer/animations/nanoX/4QuitApp/light.json";
// @ts-ignore
import NANO_X_DARK_quitApp from "~/renderer/animations/nanoX/4QuitApp/dark.json";
// @ts-ignore
import NANO_X_LIGHT_allowManager from "~/renderer/animations/nanoX/5AllowManager/light.json";
// @ts-ignore
import NANO_X_DARK_allowManager from "~/renderer/animations/nanoX/5AllowManager/dark.json";
// @ts-ignore
import NANO_X_LIGHT_openApp from "~/renderer/animations/nanoX/6OpenApp/light.json";
// @ts-ignore
import NANO_X_DARK_openApp from "~/renderer/animations/nanoX/6OpenApp/dark.json";
// @ts-ignore
import NANO_X_LIGHT_validate from "~/renderer/animations/nanoX/7Validate/light.json";
// @ts-ignore
import NANO_X_DARK_validate from "~/renderer/animations/nanoX/7Validate/dark.json";
// @ts-ignore
import NANO_X_LIGHT_firmwareUpdating from "~/renderer/animations/nanoX/2FirmwareUpdating/light.json";
// @ts-ignore
import NANO_X_DARK_firmwareUpdating from "~/renderer/animations/nanoX/2FirmwareUpdating/dark.json";
// @ts-ignore
import NANO_X_LIGHT_installLoading from "~/renderer/animations/nanoX/8InstallLoading/light.json";
// @ts-ignore
import NANO_X_DARK_installLoading from "~/renderer/animations/nanoX/8InstallLoading/dark.json";
// @ts-ignore
import NANO_X_LIGHT_recoverWithProtect from "~/renderer/animations/nanoX/RecoverWithProtect/light.json";
// @ts-ignore
import NANO_X_DARK_recoverWithProtect from "~/renderer/animations/nanoX/RecoverWithProtect/dark.json";
// NANO SP
// @ts-ignore
import NANO_SP_LIGHT_plugAndPinCode from "~/renderer/animations/nanoSP/1PlugAndPinCode/light.json";
// @ts-ignore
import NANO_SP_DARK_plugAndPinCode from "~/renderer/animations/nanoSP/1PlugAndPinCode/dark.json";
// @ts-ignore
import NANO_SP_LIGHT_enterPinCode from "~/renderer/animations/nanoSP/3EnterPinCode/light.json";
// @ts-ignore
import NANO_SP_DARK_enterPinCode from "~/renderer/animations/nanoSP/3EnterPinCode/dark.json";
// @ts-ignore
import NANO_SP_LIGHT_quitApp from "~/renderer/animations/nanoSP/4QuitApp/light.json";
// @ts-ignore
import NANO_SP_DARK_quitApp from "~/renderer/animations/nanoSP/4QuitApp/dark.json";
// @ts-ignore
import NANO_SP_LIGHT_allowManager from "~/renderer/animations/nanoSP/5AllowManager/light.json";
// @ts-ignore
import NANO_SP_DARK_allowManager from "~/renderer/animations/nanoSP/5AllowManager/dark.json";
// @ts-ignore
import NANO_SP_LIGHT_openApp from "~/renderer/animations/nanoSP/6OpenApp/light.json";
// @ts-ignore
import NANO_SP_DARK_openApp from "~/renderer/animations/nanoSP/6OpenApp/dark.json";
// @ts-ignore
import NANO_SP_LIGHT_validate from "~/renderer/animations/nanoSP/7Validate/light.json";
// @ts-ignore
import NANO_SP_DARK_validate from "~/renderer/animations/nanoSP/7Validate/dark.json";
// @ts-ignore
import NANO_SP_LIGHT_firmwareUpdating from "~/renderer/animations/nanoSP/2FirmwareUpdating/light.json";
// @ts-ignore
import NANO_SP_DARK_firmwareUpdating from "~/renderer/animations/nanoSP/2FirmwareUpdating/dark.json";
// @ts-ignore
import NANO_SP_LIGHT_installLoading from "~/renderer/animations/nanoSP/8InstallLoading/light.json";
// @ts-ignore
import NANO_SP_DARK_installLoading from "~/renderer/animations/nanoSP/8InstallLoading/dark.json";

// NANO BLUE

// @ts-ignore
import BLUE_LIGHT_plugAndPinCode from "~/renderer/animations/blue/1PlugAndPinCode/data.json";
// @ts-ignore
import BLUE_LIGHT_enterPinCode from "~/renderer/animations/blue/3EnterPinCode/data.json";
// @ts-ignore
import BLUE_LIGHT_quitApp from "~/renderer/animations/blue/4QuitApp/data.json";
// @ts-ignore
import BLUE_LIGHT_allowManager from "~/renderer/animations/blue/5AllowManager/data.json";
// @ts-ignore
import BLUE_LIGHT_openApp from "~/renderer/animations/blue/6OpenApp/data.json";
// @ts-ignore
import BLUE_LIGHT_validate from "~/renderer/animations/blue/7Validate/data.json";

// STAX

// @ts-ignore
import STAX_enterPin from "~/renderer/animations/stax/enterPIN.json";
// @ts-ignore
import STAX_verifyAddress from "~/renderer/animations/stax/verifyAddress.json";
// @ts-ignore
import STAX_signTransaction from "~/renderer/animations/stax/signTransaction.json";
// @ts-ignore
import STAX_allowConnection from "~/renderer/animations/stax/allowConnection.json";
// @ts-ignore
import STAX_confirmLockscreen from "~/renderer/animations/stax/confirmLockscreen.json";

/* eslint-enable camelcase */
type ThemedAnimation = Record<Theme["theme"], Record<string, unknown>>;
export type AnimationKey =
  | "plugAndPinCode"
  | "enterPinCode"
  | "quitApp"
  | "allowManager"
  | "openApp"
  | "verify"
  | "sign"
  | "firmwareUpdating"
  | "installLoading"
  | "confirmLockscreen"
  | "recoverWithProtect";
type DeviceAnimations = { [key in AnimationKey]: ThemedAnimation };

const nanoS: DeviceAnimations = {
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
  verify: {
    light: NANO_S_LIGHT_validate,
    dark: NANO_S_DARK_validate,
  },
  sign: {
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
  confirmLockscreen: {
    light: STAX_confirmLockscreen,
    dark: STAX_confirmLockscreen,
  },
  recoverWithProtect: {
    light: NANO_X_LIGHT_recoverWithProtect,
    dark: NANO_X_DARK_recoverWithProtect,
  },
};

const nanoX: DeviceAnimations = {
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
  verify: {
    light: NANO_X_LIGHT_validate,
    dark: NANO_X_DARK_validate,
  },
  sign: {
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
  confirmLockscreen: {
    light: STAX_confirmLockscreen,
    dark: STAX_confirmLockscreen,
  },
  recoverWithProtect: {
    light: NANO_X_LIGHT_recoverWithProtect,
    dark: NANO_X_DARK_recoverWithProtect,
  },
};

const nanoSP: DeviceAnimations = {
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
  verify: {
    light: NANO_SP_LIGHT_validate,
    dark: NANO_SP_DARK_validate,
  },
  sign: {
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
  confirmLockscreen: {
    light: STAX_confirmLockscreen,
    dark: STAX_confirmLockscreen,
  },
  recoverWithProtect: {
    light: NANO_X_LIGHT_recoverWithProtect,
    dark: NANO_X_DARK_recoverWithProtect,
  },
};

const stax: DeviceAnimations = {
  plugAndPinCode: {
    light: STAX_enterPin,
    dark: STAX_enterPin,
  },
  enterPinCode: {
    light: STAX_enterPin,
    dark: STAX_enterPin,
  },
  quitApp: {
    light: STAX_allowConnection,
    dark: STAX_allowConnection,
  },
  allowManager: {
    light: STAX_allowConnection,
    dark: STAX_allowConnection,
  },
  openApp: {
    light: STAX_allowConnection,
    dark: STAX_allowConnection,
  },
  verify: {
    light: STAX_verifyAddress,
    dark: STAX_verifyAddress,
  },
  sign: {
    light: STAX_signTransaction,
    dark: STAX_signTransaction,
  },
  firmwareUpdating: {
    light: STAX_enterPin,
    dark: STAX_enterPin,
  },
  installLoading: {
    light: STAX_allowConnection,
    dark: STAX_allowConnection,
  },
  confirmLockscreen: {
    light: STAX_confirmLockscreen,
    dark: STAX_confirmLockscreen,
  },
  recoverWithProtect: {
    light: NANO_X_LIGHT_recoverWithProtect,
    dark: NANO_X_DARK_recoverWithProtect,
  },
};

const blue: DeviceAnimations = {
  plugAndPinCode: {
    light: BLUE_LIGHT_plugAndPinCode,
    dark: BLUE_LIGHT_plugAndPinCode,
  },
  enterPinCode: {
    light: BLUE_LIGHT_enterPinCode,
    dark: BLUE_LIGHT_enterPinCode,
  },
  quitApp: {
    light: BLUE_LIGHT_quitApp,
    dark: BLUE_LIGHT_quitApp,
  },
  allowManager: {
    light: BLUE_LIGHT_allowManager,
    dark: BLUE_LIGHT_allowManager,
  },
  openApp: {
    light: BLUE_LIGHT_openApp,
    dark: BLUE_LIGHT_openApp,
  },
  verify: {
    light: BLUE_LIGHT_validate,
    dark: BLUE_LIGHT_validate,
  },
  sign: {
    light: BLUE_LIGHT_validate,
    dark: BLUE_LIGHT_validate,
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
  confirmLockscreen: {
    light: STAX_confirmLockscreen,
    dark: STAX_confirmLockscreen,
  },
  recoverWithProtect: {
    light: NANO_X_LIGHT_recoverWithProtect,
    dark: NANO_X_DARK_recoverWithProtect,
  },
};

type Animations = {
  [modelId in DeviceModelId]: DeviceAnimations;
};
const animations: Animations = { nanoX, nanoS, nanoSP, stax, blue };

export const getDeviceAnimation = (
  modelId: DeviceModelId,
  theme: Theme["theme"],
  key: AnimationKey,
) => {
  const animationModelId = (process.env.OVERRIDE_MODEL_ID as DeviceModelId) || modelId;

  // Handles the case where OVERRIDE_MODEL_ID is incorrect
  const animationModel = animations[animationModelId] || animations.nanoX;
  const animationKey: ThemedAnimation | undefined = animationModel[key];

  if (!animationKey) {
    return null;
  }

  return animationKey[theme];
};
