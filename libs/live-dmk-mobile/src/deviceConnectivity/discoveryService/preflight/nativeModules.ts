import { NativeModules } from "react-native";

export type BluetoothHelperModule = {
  E_BLE_CANCELLED?: string;
  prompt?: () => Promise<unknown>;
};

export type LocationServiceResponse =
  | "SUCCESS_LOCATION_ALREADY_ENABLED"
  | "SUCCESS_LOCATION_ENABLED"
  | "ERROR_ACTIVITY_DOES_NOT_EXIST"
  | "ERROR_USER_DENIED_LOCATION"
  | "ERROR_LOCATION_PERMISSIONS_NEEDED"
  | "ERROR_UNKNOWN";

export type LocationHelperModule = {
  checkAndRequestEnablingLocationServices?: () => Promise<LocationServiceResponse>;
};

export const getBluetoothHelperModule = (): BluetoothHelperModule | undefined => {
  const bluetoothHelperModule = NativeModules.BluetoothHelperModule;

  if (typeof bluetoothHelperModule !== "object" || bluetoothHelperModule === null) {
    return undefined;
  }

  const prompt = bluetoothHelperModule.prompt;

  return {
    E_BLE_CANCELLED:
      typeof bluetoothHelperModule.E_BLE_CANCELLED === "string"
        ? bluetoothHelperModule.E_BLE_CANCELLED
        : undefined,
    prompt: typeof prompt === "function" ? () => prompt() : undefined,
  };
};

export const getLocationHelperModule = (): LocationHelperModule | undefined => {
  const locationHelperModule = NativeModules.LocationHelperModule;

  if (typeof locationHelperModule !== "object" || locationHelperModule === null) {
    return undefined;
  }

  const checkAndRequestEnablingLocationServices =
    locationHelperModule.checkAndRequestEnablingLocationServices;

  return {
    checkAndRequestEnablingLocationServices:
      typeof checkAndRequestEnablingLocationServices === "function"
        ? () => checkAndRequestEnablingLocationServices()
        : undefined,
  };
};

export const getNativeErrorCode = (error: unknown): string | undefined =>
  typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined;
