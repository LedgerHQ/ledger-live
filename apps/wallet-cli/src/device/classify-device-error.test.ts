import { describe, expect, it } from "bun:test";
import { SendApduTimeoutError } from "@ledgerhq/device-management-kit";
import {
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  LockedDeviceError,
  ManagerDeviceLockedError,
} from "@ledgerhq/errors";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { EmptyError } from "rxjs";
import { classifyDeviceError } from "./classify-device-error";

describe("classifyDeviceError", () => {
  it("rxjs EmptyError → disconnected", () => {
    expect(classifyDeviceError(new EmptyError())).toEqual({ code: "disconnected" });
  });

  it("DisconnectedDevice and DisconnectedDeviceDuringOperation → disconnected", () => {
    expect(classifyDeviceError(new DisconnectedDevice())).toEqual({ code: "disconnected" });
    expect(classifyDeviceError(new DisconnectedDeviceDuringOperation())).toEqual({
      code: "disconnected",
    });
  });

  it("LockedDeviceError and ManagerDeviceLockedError → locked", () => {
    expect(classifyDeviceError(new LockedDeviceError())).toEqual({ code: "locked" });
    expect(classifyDeviceError(new ManagerDeviceLockedError())).toEqual({ code: "locked" });
  });

  it("DMK-tagged DeviceLockedError → locked", () => {
    expect(classifyDeviceError({ _tag: "DeviceLockedError" })).toEqual({ code: "locked" });
  });

  it("TransportStatusError LOCKED_DEVICE → locked", () => {
    expect(classifyDeviceError(new TransportStatusError(StatusCodes.LOCKED_DEVICE))).toEqual({
      code: "locked",
    });
  });

  it("TransportStatusError SECURITY_STATUS_NOT_SATISFIED (0x6982) → locked", () => {
    expect(classifyDeviceError(new TransportStatusError(0x6982))).toEqual({ code: "locked" });
  });

  it("TransportStatusError CONDITIONS_OF_USE_NOT_SATISFIED → rejected (sign by default)", () => {
    expect(classifyDeviceError(new TransportStatusError(0x6985))).toEqual({
      code: "rejected",
      context: "sign",
    });
  });

  it("TransportStatusError CONDITIONS_OF_USE_NOT_SATISFIED respects ctx.rejectedContext", () => {
    expect(
      classifyDeviceError(new TransportStatusError(0x6985), { rejectedContext: "verify_address" }),
    ).toEqual({ code: "rejected", context: "verify_address" });
  });

  it("CLA_NOT_SUPPORTED / INS_NOT_SUPPORTED → wrong_app with expected-app from ctx", () => {
    expect(
      classifyDeviceError(new TransportStatusError(StatusCodes.CLA_NOT_SUPPORTED), {
        expectedApp: "Ethereum",
      }),
    ).toEqual({ code: "wrong_app", expected: "Ethereum", found: undefined });
    expect(
      classifyDeviceError(new TransportStatusError(StatusCodes.INS_NOT_SUPPORTED), {
        expectedApp: "Ethereum",
        foundApp: "Bitcoin",
      }),
    ).toEqual({ code: "wrong_app", expected: "Ethereum", found: "Bitcoin" });
  });

  it("SendApduTimeoutError (both instance and tagged) → timeout", () => {
    expect(classifyDeviceError(new SendApduTimeoutError("t"))).toEqual({ code: "timeout" });
    expect(classifyDeviceError({ _tag: "SendApduTimeoutError" })).toEqual({ code: "timeout" });
  });

  it("transport framing tags → timeout", () => {
    expect(classifyDeviceError({ _tag: "ReceiverApduError" })).toEqual({ code: "timeout" });
    expect(classifyDeviceError({ _tag: "UnknownDeviceExchangeError" })).toEqual({
      code: "timeout",
    });
  });

  it("RefusedByUserDAError → rejected (open_app by default)", () => {
    expect(classifyDeviceError({ _tag: "RefusedByUserDAError" })).toEqual({
      code: "rejected",
      context: "open_app",
    });
  });

  it("OpenApp command error codes 670a / 6807 → app_not_installed", () => {
    expect(
      classifyDeviceError(
        { _tag: "OpenAppCommandError", errorCode: "670a" },
        { expectedApp: "Ethereum" },
      ),
    ).toEqual({ code: "app_not_installed", appName: "Ethereum" });
    expect(
      classifyDeviceError(
        { _tag: "OpenAppCommandError", errorCode: "6807" },
        { expectedApp: "Bitcoin" },
      ),
    ).toEqual({ code: "app_not_installed", appName: "Bitcoin" });
  });

  it("OpenApp error codes are case-insensitive", () => {
    expect(classifyDeviceError({ errorCode: "670A" }, { expectedApp: "Ethereum" })).toEqual({
      code: "app_not_installed",
      appName: "Ethereum",
    });
  });

  it("unrelated errors fall through to unknown with cause", () => {
    const err = new Error("boom");
    const state = classifyDeviceError(err);
    expect(state.code).toBe("unknown");
    if (state.code === "unknown") expect(state.cause).toBe(err);
  });
});
