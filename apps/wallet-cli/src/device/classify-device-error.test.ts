import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  NoAccessibleDeviceError,
  OpeningConnectionError,
  SendApduTimeoutError,
} from "@ledgerhq/device-management-kit";
import {
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  LockedDeviceError,
} from "@ledgerhq/hw-transport/errors";
import { ManagerDeviceLockedError } from "@ledgerhq/live-common/errors";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { EmptyError } from "rxjs";
import { classifyDeviceError } from "./classify-device-error";
import { DeviceConnectionFailedError, DeviceDiscoveryFailedError } from "./register-dmk-transport";
import {
  recordLedgerVendorSeen,
  recordScanCompleted,
  recordUsbAccessFailure,
  recordUsbAccessSuccess,
  resetUsbAccessDiagnostics,
} from "./usb-access-diagnostics";

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

/** The real class, not a hand-made shape, so a rename cannot silently stop matching. */
const discoveryFailure = (cause?: unknown) => new DeviceDiscoveryFailedError(cause);

describe("DeviceConnectionFailedError", () => {
  it("keeps the message an ordinary Error cause carries", () => {
    expect(new DeviceConnectionFailedError(new Error("LIBUSB_ERROR_ACCESS")).message).toBe(
      "LIBUSB_ERROR_ACCESS",
    );
  });

  it("keeps the message a DMK cause carries on originalError, having none of its own", () => {
    const dmkCause = new OpeningConnectionError(new Error("LIBUSB_ERROR_ACCESS"));
    expect(new DeviceConnectionFailedError(dmkCause).message).toBe("LIBUSB_ERROR_ACCESS");
  });

  it("falls back to its own wording when the cause says nothing", () => {
    expect(new DeviceConnectionFailedError().message).toBe(
      "Could not open a session with the Ledger.",
    );
  });
});

describe("USB failure attribution (LIVE-31394)", () => {
  beforeEach(() => {
    resetUsbAccessDiagnostics();
  });

  afterEach(() => {
    resetUsbAccessDiagnostics();
  });

  it("a scan that saw no Ledger → disconnected, carrying the attribution", () => {
    recordScanCompleted();
    expect(classifyDeviceError(discoveryFailure())).toEqual({
      code: "disconnected",
      likelyCause: "device_not_present",
    });
  });

  it("device seen on the bus but refused by the OS → sandbox_blocking_usb", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    expect(classifyDeviceError(discoveryFailure())).toEqual({
      code: "timeout",
      likelyCause: "sandbox_blocking_usb",
    });
  });

  it("device seen but unopenable (the bubblewrap/minimal-/dev case) → sandbox_blocking_usb", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("initialize error: Error: LIBUSB_ERROR_NO_DEVICE"));
    expect(classifyDeviceError(discoveryFailure())).toEqual({
      code: "timeout",
      likelyCause: "sandbox_blocking_usb",
    });
  });

  it("permission refused before any device was enumerated → still sandbox_blocking_usb", () => {
    recordScanCompleted();
    recordUsbAccessFailure(Object.assign(new Error("denied"), { code: "EACCES" }));
    expect(classifyDeviceError(discoveryFailure())).toEqual({
      code: "timeout",
      likelyCause: "sandbox_blocking_usb",
    });
  });

  it("a busy device is never blamed on a sandbox", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_BUSY"));
    expect(classifyDeviceError(discoveryFailure())).toEqual({ code: "timeout" });
  });

  it("leaves a mid-session OpeningConnectionError out of USB attribution", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    const midSession = new OpeningConnectionError("Device not connected");
    expect(classifyDeviceError(midSession)).toEqual({ code: "unknown", cause: midSession });
  });

  it("attributes a failure to open the session, which is unambiguous", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    expect(classifyDeviceError(new DeviceConnectionFailedError(new Error("nope")))).toEqual({
      code: "timeout",
      likelyCause: "sandbox_blocking_usb",
    });
  });

  it("recognises a real DMK NoAccessibleDeviceError instance", () => {
    recordScanCompleted();
    expect(classifyDeviceError(new NoAccessibleDeviceError("none"))).toEqual({
      code: "disconnected",
      likelyCause: "device_not_present",
    });
  });

  it("reads the libusb code a DMK wrapper carries on originalError, not cause", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    const dmkWrapped = new NoAccessibleDeviceError(new Error("LIBUSB_ERROR_ACCESS"));
    expect(classifyDeviceError(dmkWrapped)).toEqual({
      code: "timeout",
      likelyCause: "sandbox_blocking_usb",
    });
  });

  it("device reachable but the app never opened → app_not_open", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    expect(classifyDeviceError(new SendApduTimeoutError("t"), { expectedApp: "Ethereum" })).toEqual(
      { code: "timeout", likelyCause: "app_not_open" },
    );
  });

  it("claims nothing when no scan ever ran (mocked transport, mid-session timeout)", () => {
    expect(classifyDeviceError(new SendApduTimeoutError("t"), { expectedApp: "Ethereum" })).toEqual(
      { code: "timeout" },
    );
  });

  it("a re-enumeration failure cleared by a later success does not poison attribution", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("Error: LIBUSB_ERROR_NO_DEVICE"));
    recordUsbAccessSuccess();

    expect(classifyDeviceError(new SendApduTimeoutError("t"), { expectedApp: "Ethereum" })).toEqual(
      { code: "timeout", likelyCause: "app_not_open" },
    );
  });

  it("claims nothing when enumeration itself never completed", () => {
    recordUsbAccessFailure(new Error("libusb init failed"));
    expect(classifyDeviceError(discoveryFailure())).toEqual({ code: "timeout" });
  });

  it("classifies the wrapped cause when the transport recorded nothing itself", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    expect(classifyDeviceError(discoveryFailure(new Error("LIBUSB_ERROR_ACCESS")))).toEqual({
      code: "timeout",
      likelyCause: "sandbox_blocking_usb",
    });
  });

  it("never blames the app for a timeout while signing, though expectedApp is still set", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    expect(
      classifyDeviceError(new SendApduTimeoutError("t"), {
        expectedApp: "Ethereum",
        rejectedContext: "sign",
      }),
    ).toEqual({ code: "timeout" });
  });

  it("never blames the app for a timeout while verifying an address", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    expect(
      classifyDeviceError(new SendApduTimeoutError("t"), {
        expectedApp: "Ethereum",
        rejectedContext: "verify_address",
      }),
    ).toEqual({ code: "timeout" });
  });

  it("still blames the app when the app-open step is what we are waiting on", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    expect(
      classifyDeviceError(new SendApduTimeoutError("t"), {
        expectedApp: "Ledger dashboard",
        rejectedContext: "open_app",
      }),
    ).toEqual({ code: "timeout", likelyCause: "app_not_open" });
  });

  it("leaves unrelated errors on the unknown fallthrough", () => {
    recordScanCompleted();
    const other = new Error("something else");
    expect(classifyDeviceError(other)).toEqual({ code: "unknown", cause: other });
  });
});
