import { DeviceBusyError } from "@ledgerhq/device-management-kit";
import { isAllowedOnboardingStatePollingErrorDmk } from "./errors";

describe("isAllowedOnboardingStatePollingErrorDmk", () => {
  it("should return true if the error is a DeviceBusyError", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new DeviceBusyError())).toBe(true);
  });

  it("should return false if the error is not a DeviceBusyError or WebHidSendReportError", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new Error())).toBe(false);
  });

  it("should return false if the error is undefined", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(undefined)).toBe(false);
  });
});
