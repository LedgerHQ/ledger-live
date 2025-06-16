import { DeviceBusyError } from "@ledgerhq/device-management-kit";
import { isAllowedOnboardingStatePollingErrorDmk, isWebHidSendReportError } from "./errors";
import { WebHidSendReportError } from "@ledgerhq/device-transport-kit-web-hid";

describe("isAllowedOnboardingStatePollingErrorDmk", () => {
  it("should return true if the error is a DeviceBusyError", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new DeviceBusyError())).toBe(true);
  });

  it("should return true if the error is a WebHidSendReportError", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new WebHidSendReportError())).toBe(true);
  });

  it("should return false if the error is not a DeviceBusyError or WebHidSendReportError", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(new Error())).toBe(false);
  });

  it("should return false if the error is undefined", () => {
    expect(isAllowedOnboardingStatePollingErrorDmk(undefined)).toBe(false);
  });
});

describe("isWebHidSendReportError", () => {
  it("should return true if the error is a WebHidSendReportError", () => {
    expect(isWebHidSendReportError(new WebHidSendReportError())).toBe(true);
  });

  it("should return false if the error is a generic Error", () => {
    expect(isWebHidSendReportError(new Error())).toBe(false);
  });

  it("should return false if the error is a string", () => {
    expect(isWebHidSendReportError("error")).toBe(false);
  });

  it("should return false if the error is undefined", () => {
    expect(isWebHidSendReportError(undefined)).toBe(false);
  });

  it("should return false if the error is null", () => {
    expect(isWebHidSendReportError(null)).toBe(false);
  });

  it("should return false if the error is an object with same shape but not instance", () => {
    const fake = { name: "WebHidSendReportError", message: "fake error" };
    expect(isWebHidSendReportError(fake)).toBe(false);
  });
});
