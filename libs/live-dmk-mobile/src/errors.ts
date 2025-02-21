import { DeviceBusyError } from "@ledgerhq/device-management-kit";

export const isAllowedOnboardingStatePollingErrorDmk = (error: unknown): boolean => {
  if (error) {
    return (
      error instanceof DeviceBusyError ||
      (typeof error === "object" && "_tag" in error && error._tag === "DeviceSessionNotFound")
    );
  }

  return false;
};
