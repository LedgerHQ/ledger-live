import {
  DeviceBusyError,
  DmkError,
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

export const isWebHidSendReportError = (error: unknown): boolean => {
  if (error) {
    return error instanceof WebHidSendReportError;
  }
  return false;
};

export const isDmkError = (error: any): error is DmkError => !!error && "_tag" in error;
