import Config from "react-native-config";

export const SYNC_DELAY = 2500;
export const BLE_SCANNING_NOTHING_TIMEOUT = (Config.DETOX ? 60 : 30) * 1000;
export const GENUINE_CHECK_TIMEOUT = 120 * 1000;
export const VIBRATION_PATTERN_ERROR = [0, 150];
export const LEDGER_APPLE_WARNING_EXPLAINER_LINK =
  "https://support.ledger.com/hc/article/12309873917853-zd?docs=true";
export const PTX_SERVICES_TOAST_ID = "PTX_SERVICES_TOAST_ID";
