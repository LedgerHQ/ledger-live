import { DeviceBusyError } from "@ledgerhq/device-management-kit";
// import { WebHidSendReportError } from "@ledgerhq/device-transport-kit-web-hid";

export const isAllowedOnboardingStatePollingErrorDmk = (error: unknown): boolean => {
  if (error) {
    return (
      error instanceof DeviceBusyError ||
      // error instanceof WebHidSendReportError ||
      (typeof error === "object" && "_tag" in error && error._tag === "DeviceSessionNotFound")
    );
  }

  return false;
};
