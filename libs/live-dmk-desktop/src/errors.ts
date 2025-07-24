import {
  DeviceBusyError,
  DeviceDisconnectedBeforeSendingApdu,
  DeviceDisconnectedWhileSendingError,
} from "@ledgerhq/device-management-kit";
import { WebHidSendReportError } from "@ledgerhq/device-transport-kit-web-hid";

export const isDisconnectedWhileSendingApduError = (error: unknown): boolean => {
  if (error) {
    return (
      error instanceof WebHidSendReportError ||
      error instanceof DeviceDisconnectedBeforeSendingApdu ||
      error instanceof DeviceDisconnectedWhileSendingError
    );
  }
  return false;
};

export const isAllowedOnboardingStatePollingErrorDmk = (error: unknown): boolean => {
  if (error) {
    return (
      error instanceof DeviceBusyError ||
      (typeof error === "object" && "_tag" in error && error._tag === "DeviceSessionNotFound") ||
      isDisconnectedWhileSendingApduError(error)
    );
  }

  return false;
};
