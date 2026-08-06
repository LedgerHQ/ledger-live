/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable camelcase */
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Theme } from "@ledgerhq/react-ui";
import {
  getDeviceActionAnimation,
  type DeviceActionAnimationTheme,
  type DeviceActionContentAction,
  type DeviceActionModelId,
} from "@features/platform-device-action-content";
import type { AnimationSource } from "~/renderer/animations";

const NANO_S_LIGHT_plugAndPinCode = () =>
  import(
    /* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/1PlugAndPinCode/light.json"
  );
const NANO_S_DARK_plugAndPinCode = () =>
  import(
    /* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/1PlugAndPinCode/dark.json"
  );
const NANO_S_LIGHT_enterPinCode = () =>
  import(
    /* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/3EnterPinCode/light.json"
  );
const NANO_S_DARK_enterPinCode = () =>
  import(
    /* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/3EnterPinCode/dark.json"
  );
const NANO_S_LIGHT_quitApp = () =>
  import(/* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/4QuitApp/light.json");
const NANO_S_DARK_quitApp = () =>
  import(/* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/4QuitApp/dark.json");
const NANO_S_LIGHT_openApp = () =>
  import(/* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/6OpenApp/light.json");
const NANO_S_DARK_openApp = () =>
  import(/* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/6OpenApp/dark.json");
const NANO_S_LIGHT_validate = () =>
  import(/* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/7Validate/light.json");
const NANO_S_DARK_validate = () =>
  import(/* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/7Validate/dark.json");
const NANO_S_LIGHT_firmwareUpdating = () =>
  import(
    /* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/2FirmwareUpdating/light.json"
  );
const NANO_S_DARK_firmwareUpdating = () =>
  import(
    /* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/2FirmwareUpdating/dark.json"
  );
const NANO_S_LIGHT_installLoading = () =>
  import(
    /* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/8InstallLoading/light.json"
  );
const NANO_S_DARK_installLoading = () =>
  import(
    /* webpackChunkName: "anim-nanoS" */ "~/renderer/animations/nanoS/8InstallLoading/dark.json"
  );

const NANO_X_LIGHT_recoverWithProtect = () =>
  import(
    /* webpackChunkName: "anim-nanoX" */ "~/renderer/animations/nanoX/RecoverWithProtect/light.json"
  );
const NANO_X_DARK_recoverWithProtect = () =>
  import(
    /* webpackChunkName: "anim-nanoX" */ "~/renderer/animations/nanoX/RecoverWithProtect/dark.json"
  );

const BLUE_LIGHT_plugAndPinCode = () =>
  import(
    /* webpackChunkName: "anim-blue" */ "~/renderer/animations/blue/1PlugAndPinCode/data.json"
  );
const BLUE_LIGHT_enterPinCode = () =>
  import(/* webpackChunkName: "anim-blue" */ "~/renderer/animations/blue/3EnterPinCode/data.json");
const BLUE_LIGHT_quitApp = () =>
  import(/* webpackChunkName: "anim-blue" */ "~/renderer/animations/blue/4QuitApp/data.json");
const BLUE_LIGHT_allowManager = () =>
  import(/* webpackChunkName: "anim-blue" */ "~/renderer/animations/blue/5AllowManager/data.json");
const BLUE_LIGHT_openApp = () =>
  import(/* webpackChunkName: "anim-blue" */ "~/renderer/animations/blue/6OpenApp/data.json");
const BLUE_LIGHT_validate = () =>
  import(/* webpackChunkName: "anim-blue" */ "~/renderer/animations/blue/7Validate/data.json");

const STAX_USB_connection_success = () =>
  import(
    /* webpackChunkName: "anim-stax" */ "~/renderer/animations/stax/USBConnectionSuccess.json"
  );
const STAX_confirmLockscreen = () =>
  import(/* webpackChunkName: "anim-stax" */ "~/renderer/animations/stax/confirmLockscreen.json");

/* ⬆️ The imports above are old assets used somewhere and no new assets to replace them ⬆️ */

const NANOX_DARK_PAIRED = () =>
  import(/* webpackChunkName: "anim-nanoX" */ "~/renderer/animations/nanoX/dark/paired.json");
const NANOX_LIGHT_PAIRED = () =>
  import(/* webpackChunkName: "anim-nanoX" */ "~/renderer/animations/nanoX/light/paired.json");

const FLEX_LIGHT_ONBOARDING_SUCCESS = () =>
  import(
    /* webpackChunkName: "anim-flex" */ "~/renderer/animations/flex/light/onboardingSuccess.json"
  );
const FLEX_DARK_ONBOARDING_SUCCESS = () =>
  import(
    /* webpackChunkName: "anim-flex" */ "~/renderer/animations/flex/dark/onboardingSuccess.json"
  );

/**
 * The pin and continue assets below are owned by `@features/platform-device-action-content`,
 * which ships them for both platforms. Keeping app-local copies bundled the same bytes twice.
 */
const asset = (
  modelId: DeviceActionModelId,
  action: DeviceActionContentAction,
  theme: DeviceActionAnimationTheme,
) => getDeviceActionAnimation({ modelId, action, theme });

const NANOX_DARK_PIN = asset("nanoX", "power-and-unlock", "dark");
const NANOX_DARK_CONTINUE = asset("nanoX", "continue", "dark");
const NANOX_LIGHT_PIN = asset("nanoX", "power-and-unlock", "light");
const NANOX_LIGHT_CONTINUE = asset("nanoX", "continue", "light");

const NANOSP_DARK_PIN = asset("nanoSP", "power-and-unlock", "dark");
const NANOSP_DARK_CONTINUE = asset("nanoSP", "continue", "dark");
const NANOSP_LIGHT_PIN = asset("nanoSP", "power-and-unlock", "light");
const NANOSP_LIGHT_CONTINUE = asset("nanoSP", "continue", "light");

/* Lottie animations for devices with touchscreen */
const STAX_DARK_PIN = asset("stax", "power-and-unlock", "dark");
const STAX_DARK_CONTINUE = asset("stax", "continue", "dark");
const STAX_LIGHT_PIN = asset("stax", "power-and-unlock", "light");
const STAX_LIGHT_CONTINUE = asset("stax", "continue", "light");

const FLEX_DARK_PIN = asset("europa", "power-and-unlock", "dark");
const FLEX_DARK_CONTINUE = asset("europa", "continue", "dark");
const FLEX_LIGHT_PIN = asset("europa", "power-and-unlock", "light");
const FLEX_LIGHT_CONTINUE = asset("europa", "continue", "light");

const APEX_DARK_PIN = asset("apex", "power-and-unlock", "dark");
const APEX_DARK_CONTINUE = asset("apex", "continue", "dark");
const APEX_LIGHT_PIN = asset("apex", "power-and-unlock", "light");
const APEX_LIGHT_CONTINUE = asset("apex", "continue", "light");

type ThemedAnimation = Record<Theme["theme"], AnimationSource>;

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
