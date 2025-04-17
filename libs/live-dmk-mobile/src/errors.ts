import { DeviceBusyError, DmkError, OpeningConnectionError } from "@ledgerhq/device-management-kit";

export const isDmkError = (error: any): error is DmkError => !!error && "_tag" in error;

export const isiOSPeerRemovedPairingError = (error: any): boolean => {
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

export const isAllowedOnboardingStatePollingErrorDmk = (error: unknown): boolean => {
  if (error) {
    return (
      error instanceof DeviceBusyError ||
      (typeof error === "object" && "_tag" in error && error._tag === "DeviceSessionNotFound")
    );
  }

  return false;
};
