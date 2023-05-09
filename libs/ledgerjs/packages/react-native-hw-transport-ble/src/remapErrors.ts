import {
  DisconnectedDevice,
  HwTransportError,
  HwTransportErrorType,
  PairingFailed,
  PeerRemovedPairing,
} from "@ledgerhq/errors";
import { BleATTErrorCode, BleError, BleErrorCode } from "react-native-ble-plx";

type IOBleErrorRemap = Error | BleError | null | undefined;
export const remapError = (error: IOBleErrorRemap): IOBleErrorRemap => {
  if (!error || !error.message) return error;

  if (error instanceof BleError) {
    if (
      error.iosErrorCode === BleATTErrorCode.UnlikelyError ||
      error.reason === "Peer removed pairing information"
    ) {
      return new PeerRemovedPairing();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore It's not documented but seems to match a refusal on Android pairing
    } else if (error?.attErrorCode === 22) {
      return new PairingFailed();
    }
  }

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
