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
// @ts-ignore
import NANO_X_LIGHT_recoverWithProtect from "~/renderer/animations/nanoX/RecoverWithProtect/light.json";
// @ts-ignore
import NANO_X_DARK_recoverWithProtect from "~/renderer/animations/nanoX/RecoverWithProtect/dark.json";
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
// @ts-ignore
import STAX_USB_connection_success from "~/renderer/animations/stax/USBConnectionSuccess.json";
// @ts-ignore
import STAX_confirmLockscreen from "~/renderer/animations/stax/confirmLockscreen.json";

/**
 * ⬆️ The imports above are old assets used somewhere and no new assets to replace them ⬆️
 */

/****** ⬇️ NEW ASSETS START @13.12.2024 ⬇️ *****/

// @ts-ignore
import STAX_DARK_PIN from "~/renderer/animations/stax/dark/pin.json";
// // @ts-ignore
// import STAX_DARK_PAIRING from "~/renderer/animations/stax/dark/pairing.json";
// @ts-ignore
import STAX_DARK_PAIRED from "~/renderer/animations/stax/dark/paired.json";
// @ts-ignore
import STAX_DARK_CONTINUE from "~/renderer/animations/stax/dark/continue.json";
// @ts-ignore
import STAX_LIGHT_PIN from "~/renderer/animations/stax/light/pin.json";
// // @ts-ignore
// import STAX_LIGHT_PAIRING from "~/renderer/animations/stax/light/pairing.json";
// @ts-ignore
import STAX_LIGHT_PAIRED from "~/renderer/animations/stax/light/paired.json";
// @ts-ignore
import STAX_LIGHT_CONTINUE from "~/renderer/animations/stax/light/continue.json";

// @ts-ignore
import FLEX_DARK_PIN from "~/renderer/animations/flex/dark/pin.json";
// // @ts-ignore
// import FLEX_DARK_PAIRING from "~/renderer/animations/flex/dark/pairing.json";
// @ts-ignore
import FLEX_DARK_PAIRED from "~/renderer/animations/flex/dark/paired.json";
// @ts-ignore
import FLEX_DARK_CONTINUE from "~/renderer/animations/flex/dark/continue.json";
// @ts-ignore
import FLEX_LIGHT_PIN from "~/renderer/animations/flex/light/pin.json";
// // @ts-ignore
// import FLEX_LIGHT_PAIRING from "~/renderer/animations/flex/light/pairing.json";
// @ts-ignore
import FLEX_LIGHT_PAIRED from "~/renderer/animations/flex/light/paired.json";
// @ts-ignore
import FLEX_LIGHT_CONTINUE from "~/renderer/animations/flex/light/continue.json";

// @ts-ignore
import NANOX_DARK_PIN from "~/renderer/animations/nanoX/dark/pin.json";
// // @ts-ignore
// import NANOX_DARK_PAIRING from "~/renderer/animations/nanoX/dark/pairing.json";
// @ts-ignore
import NANOX_DARK_PAIRED from "~/renderer/animations/nanoX/dark/paired.json";
// @ts-ignore
import NANOX_DARK_CONTINUE from "~/renderer/animations/nanoX/dark/continue.json";
// @ts-ignore
import NANOX_LIGHT_PIN from "~/renderer/animations/nanoX/light/pin.json";
// // @ts-ignore
// import NANOX_LIGHT_PAIRING from "~/renderer/animations/nanoX/light/pairing.json";
// @ts-ignore
import NANOX_LIGHT_PAIRED from "~/renderer/animations/nanoX/light/paired.json";
// @ts-ignore
import NANOX_LIGHT_CONTINUE from "~/renderer/animations/nanoX/light/continue.json";

// @ts-ignore
import NANOSP_DARK_PIN from "~/renderer/animations/nanoSP/dark/pin.json";
// @ts-ignore
import NANOSP_DARK_CONTINUE from "~/renderer/animations/nanoSP/dark/continue.json";
// @ts-ignore
import NANOSP_LIGHT_PIN from "~/renderer/animations/nanoSP/light/pin.json";
// @ts-ignore
import NANOSP_LIGHT_CONTINUE from "~/renderer/animations/nanoSP/light/continue.json";

// Flex onboarding success animation
import FLEX_LIGHT_ONBOARDING_SUCCESS from "~/renderer/animations/flex/light/onboardingSuccess.json";
import FLEX_DARK_ONBOARDING_SUCCESS from "~/renderer/animations/flex/dark/onboardingSuccess.json";

import FLEX_LIGHT_CONFIRM_LOCKSCREEN from "~/renderer/animations/flex/light/confirmLockscreen.json";
import FLEX_DARK_CONFIRM_LOCKSCREEN from "~/renderer/animations/flex/dark/confirmLockscreen.json";

import STAX_LIGHT_CONFIRM_LOCKSCREEN from "~/renderer/animations/stax/light/frame.json";
import STAX_DARK_CONFIRM_LOCKSCREEN from "~/renderer/animations/stax/dark/frame.json";

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
  confirmLockscreen: {
    light: STAX_LIGHT_CONFIRM_LOCKSCREEN,
    dark: STAX_DARK_CONFIRM_LOCKSCREEN,
  },
  recoverWithProtect: {
    light: STAX_LIGHT_PAIRED,
    dark: STAX_DARK_PAIRED,
  },
  connectionSuccess: {
    light: STAX_LIGHT_PAIRED,
    dark: STAX_DARK_PAIRED,
  },
};

const europa: DeviceAnimations<AnimationKey | "onboardingSuccess"> = {
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
  // Keep
  confirmLockscreen: {
    light: FLEX_LIGHT_CONFIRM_LOCKSCREEN,
    dark: FLEX_DARK_CONFIRM_LOCKSCREEN,
  },
  recoverWithProtect: {
    light: FLEX_LIGHT_PAIRED,
    dark: FLEX_DARK_PAIRED,
  },
  connectionSuccess: {
    light: FLEX_LIGHT_PAIRED,
    dark: FLEX_DARK_PAIRED,
  },
  // Keep
  onboardingSuccess: {
    light: FLEX_LIGHT_ONBOARDING_SUCCESS,
    dark: FLEX_DARK_ONBOARDING_SUCCESS,
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

const animations = { nanoX, nanoS, nanoSP, stax, europa, blue };

export const getDeviceAnimation = (
  modelId: DeviceModelId,
  theme: Theme["theme"],
  key: AnimationKey | "onboardingSuccess",
) => {
  const animationModelId = (process.env.OVERRIDE_MODEL_ID as DeviceModelId) || modelId;

  // Handles the case where OVERRIDE_MODEL_ID is incorrect
  const animationModel = animations[animationModelId] || animations.nanoX;
  const animationKey: ThemedAnimation | undefined =
    animationModel[animationModelId === "europa" ? key : (key as AnimationKey)];

  if (!animationKey) {
    return null;
  }

  return animationKey[theme];
};
