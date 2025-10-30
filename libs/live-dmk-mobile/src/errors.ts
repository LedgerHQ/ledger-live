import {
  DeviceBusyError,
  DmkError,
  OpeningConnectionError,
  SendApduTimeoutError,
} from "@ledgerhq/device-management-kit";
import { PeerRemovedPairingError } from "@ledgerhq/device-transport-kit-react-native-ble";

export const isDmkError = (error: unknown): error is DmkError =>
  !!error && typeof error === "object" && error !== null && "_tag" in error;

export const isiOSPeerRemovedPairingError = (error: unknown): boolean => {
  return (
    error instanceof OpeningConnectionError &&
    "originalError" in error &&
    error.originalError !== null &&
    error.originalError !== undefined &&
    typeof error.originalError === "object" &&
    "reason" in error.originalError &&
    error.originalError.reason === "Peer removed pairing information"
  );
};

export const isPeerRemovedPairingError = (error: unknown): boolean => {
  if (error instanceof PeerRemovedPairingError) {
    return true;
  }
  if (isiOSPeerRemovedPairingError(error)) {
    return true;
  }
  return false;
};

export const isAllowedOnboardingStatePollingErrorDmk = (error: unknown): boolean => {
  if (isDmkError(error)) {
    return (
      error instanceof SendApduTimeoutError ||
      error instanceof DeviceBusyError ||
      error._tag === "DeviceSessionNotFound"
    );
  }
  return false;
};
