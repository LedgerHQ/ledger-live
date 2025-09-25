/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable camelcase */
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Theme } from "@ledgerhq/react-ui";

import NANO_S_LIGHT_plugAndPinCode from "~/renderer/animations/nanoS/1PlugAndPinCode/light.json";
import NANO_S_DARK_plugAndPinCode from "~/renderer/animations/nanoS/1PlugAndPinCode/dark.json";
import NANO_S_LIGHT_enterPinCode from "~/renderer/animations/nanoS/3EnterPinCode/light.json";
import NANO_S_DARK_enterPinCode from "~/renderer/animations/nanoS/3EnterPinCode/dark.json";
import NANO_S_LIGHT_quitApp from "~/renderer/animations/nanoS/4QuitApp/light.json";
import NANO_S_DARK_quitApp from "~/renderer/animations/nanoS/4QuitApp/dark.json";
import NANO_S_LIGHT_openApp from "~/renderer/animations/nanoS/6OpenApp/light.json";
import NANO_S_DARK_openApp from "~/renderer/animations/nanoS/6OpenApp/dark.json";
import NANO_S_LIGHT_validate from "~/renderer/animations/nanoS/7Validate/light.json";
import NANO_S_DARK_validate from "~/renderer/animations/nanoS/7Validate/dark.json";
import NANO_S_LIGHT_firmwareUpdating from "~/renderer/animations/nanoS/2FirmwareUpdating/light.json";
import NANO_S_DARK_firmwareUpdating from "~/renderer/animations/nanoS/2FirmwareUpdating/dark.json";
import NANO_S_LIGHT_installLoading from "~/renderer/animations/nanoS/8InstallLoading/light.json";
import NANO_S_DARK_installLoading from "~/renderer/animations/nanoS/8InstallLoading/dark.json";

import NANO_X_LIGHT_recoverWithProtect from "~/renderer/animations/nanoX/RecoverWithProtect/light.json";
import NANO_X_DARK_recoverWithProtect from "~/renderer/animations/nanoX/RecoverWithProtect/dark.json";

import BLUE_LIGHT_plugAndPinCode from "~/renderer/animations/blue/1PlugAndPinCode/data.json";
import BLUE_LIGHT_enterPinCode from "~/renderer/animations/blue/3EnterPinCode/data.json";
import BLUE_LIGHT_quitApp from "~/renderer/animations/blue/4QuitApp/data.json";
import BLUE_LIGHT_allowManager from "~/renderer/animations/blue/5AllowManager/data.json";
import BLUE_LIGHT_openApp from "~/renderer/animations/blue/6OpenApp/data.json";
import BLUE_LIGHT_validate from "~/renderer/animations/blue/7Validate/data.json";

import STAX_USB_connection_success from "~/renderer/animations/stax/USBConnectionSuccess.json";
import STAX_confirmLockscreen from "~/renderer/animations/stax/confirmLockscreen.json";

/* ⬆️ The imports above are old assets used somewhere and no new assets to replace them ⬆️ */

import NANOX_DARK_PIN from "~/renderer/animations/nanoX/dark/pin.json";
import NANOX_DARK_PAIRED from "~/renderer/animations/nanoX/dark/paired.json";
import NANOX_DARK_CONTINUE from "~/renderer/animations/nanoX/dark/continue.json";
import NANOX_LIGHT_PIN from "~/renderer/animations/nanoX/light/pin.json";
import NANOX_LIGHT_PAIRED from "~/renderer/animations/nanoX/light/paired.json";
import NANOX_LIGHT_CONTINUE from "~/renderer/animations/nanoX/light/continue.json";

import NANOSP_DARK_PIN from "~/renderer/animations/nanoSP/dark/pin.json";
import NANOSP_DARK_CONTINUE from "~/renderer/animations/nanoSP/dark/continue.json";
import NANOSP_LIGHT_PIN from "~/renderer/animations/nanoSP/light/pin.json";
import NANOSP_LIGHT_CONTINUE from "~/renderer/animations/nanoSP/light/continue.json";

/* Lottie animations for devices with touchscreen */
import STAX_DARK_PIN from "~/renderer/animations/stax/dark/pin.json";
import STAX_DARK_CONTINUE from "~/renderer/animations/stax/dark/continue.json";
import STAX_LIGHT_PIN from "~/renderer/animations/stax/light/pin.json";
import STAX_LIGHT_CONTINUE from "~/renderer/animations/stax/light/continue.json";

import FLEX_DARK_PIN from "~/renderer/animations/flex/dark/pin.json";
import FLEX_DARK_CONTINUE from "~/renderer/animations/flex/dark/continue.json";
import FLEX_LIGHT_PIN from "~/renderer/animations/flex/light/pin.json";
import FLEX_LIGHT_CONTINUE from "~/renderer/animations/flex/light/continue.json";

import APEX_DARK_PIN from "~/renderer/animations/apex/dark/pin.json";
import APEX_DARK_CONTINUE from "~/renderer/animations/apex/dark/continue.json";
import APEX_LIGHT_PIN from "~/renderer/animations/apex/light/pin.json";
import APEX_LIGHT_CONTINUE from "~/renderer/animations/apex/light/continue.json";

import FLEX_LIGHT_ONBOARDING_SUCCESS from "~/renderer/animations/flex/light/onboardingSuccess.json";
import FLEX_DARK_ONBOARDING_SUCCESS from "~/renderer/animations/flex/dark/onboardingSuccess.json";

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
  | "recoverWithProtect"
  | "connectionSuccess";

type DeviceAnimations<Key extends string = string> = { [key in Key]: ThemedAnimation };

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
    light: NANO_S_LIGHT_validate,
    dark: NANO_S_DARK_validate,
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
  connectionSuccess: {
    light: STAX_USB_connection_success,
    dark: STAX_USB_connection_success,
  },
};

const nanoX: DeviceAnimations = {
  plugAndPinCode: {
    light: NANOX_LIGHT_PIN,
    dark: NANOX_DARK_PIN,
  },
  enterPinCode: {
    light: NANOX_LIGHT_PIN,
    dark: NANOX_DARK_PIN,
  },
  quitApp: {
    light: NANOX_LIGHT_CONTINUE,
    dark: NANOX_DARK_CONTINUE,
  },
  allowManager: {
    light: NANOX_LIGHT_CONTINUE,
    dark: NANOX_DARK_CONTINUE,
  },
  openApp: {
    light: NANOX_LIGHT_CONTINUE,
    dark: NANOX_DARK_CONTINUE,
  },
  verify: {
    light: NANOX_LIGHT_CONTINUE,
    dark: NANOX_DARK_CONTINUE,
  },
  sign: {
    light: NANOX_LIGHT_CONTINUE,
    dark: NANOX_DARK_CONTINUE,
  },
  firmwareUpdating: {
    light: NANOX_LIGHT_PIN,
    dark: NANOX_DARK_PIN,
  },
  installLoading: {
    light: NANOX_LIGHT_CONTINUE,
    dark: NANOX_DARK_CONTINUE,
  },
  recoverWithProtect: {
    light: NANOX_LIGHT_PAIRED,
    dark: NANOX_DARK_PAIRED,
  },
  connectionSuccess: {
    light: NANOX_LIGHT_PAIRED,
    dark: NANOX_DARK_PAIRED,
  },
};

const nanoSP: DeviceAnimations = {
  plugAndPinCode: {
    light: NANOSP_LIGHT_PIN,
    dark: NANOSP_DARK_PIN,
  },
  enterPinCode: {
    light: NANOSP_LIGHT_PIN,
    dark: NANOSP_DARK_PIN,
  },
  quitApp: {
    light: NANOSP_LIGHT_CONTINUE,
    dark: NANOSP_DARK_CONTINUE,
  },
  allowManager: {
    light: NANOSP_LIGHT_CONTINUE,
    dark: NANOSP_DARK_CONTINUE,
  },
  openApp: {
    light: NANOSP_LIGHT_CONTINUE,
    dark: NANOSP_DARK_CONTINUE,
  },
  verify: {
    light: NANOSP_LIGHT_CONTINUE,
    dark: NANOSP_DARK_CONTINUE,
  },
  sign: {
    light: NANOSP_LIGHT_CONTINUE,
    dark: NANOSP_DARK_CONTINUE,
  },
  firmwareUpdating: {
    light: NANOSP_LIGHT_PIN,
    dark: NANOSP_DARK_PIN,
  },
  installLoading: {
    light: NANOSP_LIGHT_CONTINUE,
    dark: NANOSP_DARK_CONTINUE,
  },
  recoverWithProtect: {
    light: NANOSP_LIGHT_CONTINUE,
    dark: NANOSP_DARK_CONTINUE,
  },
  connectionSuccess: {
    light: NANOSP_LIGHT_CONTINUE,
    dark: NANOSP_DARK_CONTINUE,
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
  connectionSuccess: {
    light: STAX_USB_connection_success,
    dark: STAX_USB_connection_success,
  },
};

const stax: DeviceAnimations = {
  plugAndPinCode: {
    light: STAX_LIGHT_PIN,
    dark: STAX_DARK_PIN,
  },
  enterPinCode: {
    light: STAX_LIGHT_PIN,
    dark: STAX_DARK_PIN,
  },
  quitApp: {
    light: STAX_LIGHT_CONTINUE,
    dark: STAX_DARK_CONTINUE,
  },
  allowManager: {
    light: STAX_LIGHT_CONTINUE,
    dark: STAX_DARK_CONTINUE,
  },
  openApp: {
    light: STAX_LIGHT_CONTINUE,
    dark: STAX_DARK_CONTINUE,
  },
  verify: {
    light: STAX_LIGHT_CONTINUE,
    dark: STAX_DARK_CONTINUE,
  },
  sign: {
    light: STAX_LIGHT_CONTINUE,
    dark: STAX_DARK_CONTINUE,
  },
  firmwareUpdating: {
    light: STAX_LIGHT_PIN,
    dark: STAX_DARK_PIN,
  },
  installLoading: {
    light: STAX_LIGHT_CONTINUE,
    dark: STAX_DARK_CONTINUE,
  },
  recoverWithProtect: {
    light: STAX_LIGHT_CONTINUE,
    dark: STAX_DARK_CONTINUE,
  },
  connectionSuccess: {
    light: STAX_LIGHT_CONTINUE,
    dark: STAX_DARK_CONTINUE,
  },
};

const europa: DeviceAnimations = {
  plugAndPinCode: {
    light: FLEX_LIGHT_PIN,
    dark: FLEX_DARK_PIN,
  },
  enterPinCode: {
    light: FLEX_LIGHT_PIN,
    dark: FLEX_DARK_PIN,
  },
  quitApp: {
    light: FLEX_LIGHT_CONTINUE,
    dark: FLEX_DARK_CONTINUE,
  },
  allowManager: {
    light: FLEX_LIGHT_CONTINUE,
    dark: FLEX_DARK_CONTINUE,
  },
  openApp: {
    light: FLEX_LIGHT_CONTINUE,
    dark: FLEX_DARK_CONTINUE,
  },
  verify: {
    light: FLEX_LIGHT_CONTINUE,
    dark: FLEX_DARK_CONTINUE,
  },
  sign: {
    light: FLEX_LIGHT_CONTINUE,
    dark: FLEX_DARK_CONTINUE,
  },
  firmwareUpdating: {
    light: FLEX_LIGHT_PIN,
    dark: FLEX_DARK_PIN,
  },
  installLoading: {
    light: FLEX_LIGHT_CONTINUE,
    dark: FLEX_DARK_CONTINUE,
  },
  recoverWithProtect: {
    light: FLEX_LIGHT_CONTINUE,
    dark: FLEX_DARK_CONTINUE,
  },
  connectionSuccess: {
    light: FLEX_LIGHT_CONTINUE,
    dark: FLEX_DARK_CONTINUE,
  },
  onboardingSuccess: {
    light: FLEX_LIGHT_ONBOARDING_SUCCESS,
    dark: FLEX_DARK_ONBOARDING_SUCCESS,
  },
};

const apex: DeviceAnimations = {
  plugAndPinCode: {
    light: APEX_LIGHT_PIN,
    dark: APEX_DARK_PIN,
  },
  enterPinCode: {
    light: APEX_LIGHT_PIN,
    dark: APEX_DARK_PIN,
  },
  quitApp: {
    light: APEX_LIGHT_CONTINUE,
    dark: APEX_DARK_CONTINUE,
  },
  allowManager: {
    light: APEX_LIGHT_CONTINUE,
    dark: APEX_DARK_CONTINUE,
  },
  openApp: {
    light: APEX_LIGHT_CONTINUE,
    dark: APEX_DARK_CONTINUE,
  },
  verify: {
    light: APEX_LIGHT_CONTINUE,
    dark: APEX_DARK_CONTINUE,
  },
  sign: {
    light: APEX_LIGHT_CONTINUE,
    dark: APEX_DARK_CONTINUE,
  },
  firmwareUpdating: {
    light: APEX_LIGHT_PIN,
    dark: APEX_DARK_PIN,
  },
  installLoading: {
    light: APEX_LIGHT_CONTINUE,
    dark: APEX_DARK_CONTINUE,
  },
  recoverWithProtect: {
    light: APEX_LIGHT_CONTINUE,
    dark: APEX_DARK_CONTINUE,
  },
  connectionSuccess: {
    light: APEX_LIGHT_CONTINUE,
    dark: APEX_DARK_CONTINUE,
  },
};

const animations = { nanoX, nanoS, nanoSP, blue, stax, europa, apex };

export const getDeviceAnimation = (
  deviceModelId: DeviceModelId,
  theme: Theme["theme"],
  key: AnimationKey | "onboardingSuccess",
) => {
  const animationModelId = (process.env.OVERRIDE_MODEL_ID as DeviceModelId) || deviceModelId;
  // Handles the case where OVERRIDE_MODEL_ID is incorrect
  const animationModel = animations[animationModelId] || animations.nanoX;
  const animationKey: ThemedAnimation | null = animationModel[key] ?? null;
  if (!animationKey) {
    return null;
  }
  return animationKey[theme];
};
