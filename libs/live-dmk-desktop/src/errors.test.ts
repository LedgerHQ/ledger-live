import {
  DeviceBusyError,
  DeviceDisconnectedBeforeSendingApdu,
  DeviceDisconnectedWhileSendingError,
} from "@ledgerhq/device-management-kit";
import {
  isAllowedOnboardingStatePollingErrorDmk,
  isDisconnectedWhileSendingApduError,
} from "./errors";
import { WebHidSendReportError } from "@ledgerhq/device-transport-kit-web-hid";

describe("isAllowedOnboardingStatePollingErrorDmk", () => {
  it("should return true if the error is a DeviceBusyError", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new DeviceBusyError())).toBe(true);
  });

  it("should return true if the error is a WebHidSendReportError", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new WebHidSendReportError())).toBe(true);
  });

  it("should return true if the error is a DeviceSessionNotFound", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk({ _tag: "DeviceSessionNotFound" })).toBe(true);
  });

  it("should return true if the error is a DeviceDisconnectedBeforeSendingApdu", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new DeviceDisconnectedBeforeSendingApdu())).toBe(
      true,
    );
  });

  it("should return true if the error is a DeviceDisconnectedWhileSendingError", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new DeviceDisconnectedWhileSendingError())).toBe(
      true,
    );
  });

  it("should return false if the error is another type of error", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new Error())).toBe(false);
  });

  it("should return false if the error is undefined", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(undefined)).toBe(false);
  });
});

describe("isDisconnectedWhileSendingApduError", () => {
  it("should return true if the error is a WebHidSendReportError", () => {
    expect(isDisconnectedWhileSendingApduError(new WebHidSendReportError())).toBe(true);
  });

  it("should return true if the error is a DeviceDisconnectedBeforeSendingApdu", () => {
    expect(isDisconnectedWhileSendingApduError(new DeviceDisconnectedBeforeSendingApdu())).toBe(
      true,
    );
  });

  it("should return true if the error is a DeviceDisconnectedWhileSendingError", () => {
    expect(isDisconnectedWhileSendingApduError(new DeviceDisconnectedWhileSendingError())).toBe(
      true,
    );
  });

  it("should return false if the error is a generic Error", () => {
    expect(isDisconnectedWhileSendingApduError(new Error())).toBe(false);
  });

  it("should return false if the error is a string", () => {
    expect(isDisconnectedWhileSendingApduError("error")).toBe(false);
  });

  it("should return false if the error is undefined", () => {
    expect(isDisconnectedWhileSendingApduError(undefined)).toBe(false);
  });

  it("should return false if the error is null", () => {
    expect(isDisconnectedWhileSendingApduError(null)).toBe(false);
  });

  it("should return false if the error is an object with same shape but not instance", () => {
    const fake = { name: "WebHidSendReportError", message: "fake error" };
    expect(isDisconnectedWhileSendingApduError(fake)).toBe(false);
  });
});
