import {
  DisconnectedDevice,
  HwTransportError,
  HwTransportErrorType,
} from "@ledgerhq/errors";
import { BleError, BleErrorCode } from "react-native-ble-plx";

export const remapError = (error: Error | null | undefined) => {
  if (!error || !error.message) return error;

  if (
    error.message.includes("was disconnected") ||
    error.message.includes("not found")
  ) {
    return new DisconnectedDevice();
  }

  return error;
};

export const rethrowError = (e: Error | null | undefined): never => {
  throw remapError(e);
};

export const decoratePromiseErrors = <A>(promise: Promise<A>): Promise<A> =>
  promise.catch(rethrowError);

export const bleErrorToHwTransportError = new Map([
  [BleErrorCode.ScanStartFailed, HwTransportErrorType.BluetoothScanStartFailed],
  [
    BleErrorCode.LocationServicesDisabled,
    HwTransportErrorType.LocationServicesDisabled,
  ],
  [
    // BluetoothUnauthorized actually represents a location service unauthorized error
    BleErrorCode.BluetoothUnauthorized,
    HwTransportErrorType.LocationServicesUnauthorized,
  ],
]);

export const mapBleErrorToHwTransportError = (
  bleError: BleError
): HwTransportError => {
  const message = `${bleError.message}. Origin: ${bleError.errorCode}`;

  const inferedType = bleErrorToHwTransportError.get(bleError.errorCode);
  const type = !inferedType ? HwTransportErrorType.Unknown : inferedType;

  return new HwTransportError(type, message);
};
