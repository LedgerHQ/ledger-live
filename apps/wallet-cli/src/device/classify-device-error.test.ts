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
import { setAgentEnvironment } from "../testing/agent-env";
import { LINUX_SANDBOX_OPEN_ERROR_MESSAGE } from "../testing/usb-sandbox-fixtures";
import { classifyDeviceError, usbTimeoutState } from "./classify-device-error";
import { DEVICE_EXIT_CODES, renderDeviceState } from "./device-state";
import {
  DeviceConnectionFailedError,
  DeviceDiscoveryFailedError,
  InitialSessionBusyError,
} from "./register-dmk-transport";
import {
  recordLedgerVendorSeen,
  recordScanCompleted,
  recordScanStarted,
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

describe("classifyDeviceError on Speculos", () => {
  const speculosUrl = "http://127.0.0.1:40000";

  beforeEach(() => {
    process.env.SPECULOS_API_PORT = "40000";
  });

  afterEach(() => {
    delete process.env.SPECULOS_API_PORT;
  });

  it("disconnects and timeouts name the active Speculos", () => {
    expect(classifyDeviceError(new DisconnectedDevice())).toEqual({
      code: "disconnected",
      speculosUrl,
    });
    expect(classifyDeviceError(new SendApduTimeoutError("slow"))).toEqual({
      code: "timeout",
      speculosUrl,
    });
    expect(classifyDeviceError({ _tag: "ReceiverApduError" })).toEqual({
      code: "timeout",
      speculosUrl,
    });
  });

  it("a timeout keeps its code and carries no USB attribution", () => {
    expect(usbTimeoutState({ expectedApp: "Ethereum", rejectedContext: "open_app" })).toEqual({
      code: "timeout",
      speculosUrl,
    });
  });

  it("a discovery failure or a busy session stays unknown, with no USB attribution", () => {
    const discovery = new DeviceDiscoveryFailedError();
    expect(classifyDeviceError(discovery)).toEqual({ code: "unknown", cause: discovery });
    const busy = new InitialSessionBusyError();
    expect(classifyDeviceError(busy)).toEqual({ code: "unknown", cause: busy });
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
  let restoreAgentEnvironment: () => void;

  beforeEach(() => {
    resetUsbAccessDiagnostics();
    restoreAgentEnvironment = setAgentEnvironment("claude");
  });

  afterEach(() => {
    resetUsbAccessDiagnostics();
    restoreAgentEnvironment();
  });

  it("a discovery failure keeps its unknown code and exit 1, and carries the attribution", () => {
    recordScanCompleted();
    const error = discoveryFailure();
    const state = classifyDeviceError(error);
    expect(state).toEqual({ code: "unknown", cause: error, likelyCause: "device_not_present" });
    expect(renderDeviceState(state)).toMatchObject({
      message: "No Ledger device found. Unlock the device and try again.",
      exitCode: DEVICE_EXIT_CODES.generic,
    });
  });

  it("an APDU timeout after a rescan that saw no Ledger keeps its timeout code and exit 6", () => {
    recordScanCompleted();
    const state = classifyDeviceError(new SendApduTimeoutError("t"), { expectedApp: "Ethereum" });
    expect(state).toEqual({ code: "timeout", likelyCause: "device_not_present" });
    expect(renderDeviceState(state)).toMatchObject({
      message: "No Ledger detected over USB. Plug in, unlock, retry.",
      exitCode: DEVICE_EXIT_CODES.timeout,
    });
  });

  it("an unplugged device keeps its disconnected code and exit 3", () => {
    recordScanCompleted();
    const state = classifyDeviceError(new EmptyError());
    expect(state).toEqual({ code: "disconnected" });
    expect(renderDeviceState(state).exitCode).toBe(DEVICE_EXIT_CODES.disconnected);
  });

  it("a Ledger the OS refused to open, under an agent → sandbox_blocking_usb, named on one line", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    const error = discoveryFailure();
    const state = classifyDeviceError(error);
    expect(state).toEqual({ code: "unknown", cause: error, likelyCause: "sandbox_blocking_usb" });
    expect(renderDeviceState(state)).toMatchObject({
      message: "USB access to the Ledger was refused, likely by the agent sandbox.",
      exitCode: DEVICE_EXIT_CODES.generic,
    });
  });

  it("an APDU timeout after the OS refused a reopen, under an agent → sandbox_blocking_usb", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("claimInterface error: Error: LIBUSB_ERROR_ACCESS"));
    const state = classifyDeviceError(new SendApduTimeoutError("t"));
    expect(state).toEqual({ code: "timeout", likelyCause: "sandbox_blocking_usb" });
    expect(renderDeviceState(state)).toMatchObject({
      message: "USB access to the Ledger was refused, likely by the agent sandbox.",
      exitCode: DEVICE_EXIT_CODES.timeout,
    });
  });

  it("the Linux sandbox recording, where libusb then drops the Ledger → sandbox_blocking_usb", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error(LINUX_SANDBOX_OPEN_ERROR_MESSAGE));
    recordScanStarted();
    recordScanCompleted();
    const error = discoveryFailure(new Error("Timeout has occurred"));
    expect(classifyDeviceError(error)).toEqual({
      code: "unknown",
      cause: error,
      likelyCause: "sandbox_blocking_usb",
    });
  });

  it("an access refusal outside any agent is not blamed on a sandbox (udev rules, another process)", () => {
    restoreAgentEnvironment();
    restoreAgentEnvironment = setAgentEnvironment("none");
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    const error = discoveryFailure();
    const state = classifyDeviceError(error);
    expect(state).toEqual({ code: "unknown", cause: error, likelyCause: "unknown" });
    expect(renderDeviceState(state).message).toBe(
      "No Ledger device found. Unlock the device and try again.",
    );
  });

  it("a busy device is never blamed on a sandbox", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_BUSY"));
    const error = discoveryFailure();
    expect(classifyDeviceError(error)).toEqual({
      code: "unknown",
      cause: error,
      likelyCause: "unknown",
    });
  });

  it("a session that opens busy is never blamed on a sandbox a stale failure points at", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    const busy = new InitialSessionBusyError();
    const state = classifyDeviceError(busy, { expectedApp: "Ethereum" });
    expect(state).toEqual({ code: "unknown", cause: busy, likelyCause: "unknown" });
    expect(renderDeviceState(state).exitCode).toBe(DEVICE_EXIT_CODES.generic);
  });

  it("leaves a mid-session OpeningConnectionError out of USB attribution", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    const midSession = new OpeningConnectionError("Device not connected");
    expect(classifyDeviceError(midSession)).toEqual({ code: "unknown", cause: midSession });
  });

  it("attributes a failure to open the session", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("open error: Error: LIBUSB_ERROR_ACCESS"));
    const error = new DeviceConnectionFailedError(new Error("nope"));
    expect(classifyDeviceError(error)).toEqual({
      code: "unknown",
      cause: error,
      likelyCause: "sandbox_blocking_usb",
    });
  });

  it("recognises a real DMK NoAccessibleDeviceError instance", () => {
    recordScanCompleted();
    const error = new NoAccessibleDeviceError("none");
    expect(classifyDeviceError(error)).toEqual({
      code: "unknown",
      cause: error,
      likelyCause: "device_not_present",
    });
  });

  it("device reachable while the app-open step waits → app_not_open", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    const state = classifyDeviceError(new SendApduTimeoutError("t"), {
      expectedApp: "Ethereum",
      rejectedContext: "open_app",
    });
    expect(state).toEqual({ code: "timeout", likelyCause: "app_not_open" });
    expect(renderDeviceState(state).message).toBe("Timed out waiting for the Ledger app to open.");
  });

  it("never blames the app when the caller does not say it is opening one", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    expect(classifyDeviceError(new SendApduTimeoutError("t"), { expectedApp: "Ethereum" })).toEqual(
      { code: "timeout" },
    );
  });

  it("never blames the app for a discover scan that times out after accounts were found", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    const midScan = new SendApduTimeoutError("t");
    expect(classifyDeviceError(midScan, { expectedApp: "Ethereum" })).toEqual({ code: "timeout" });
    expect(usbTimeoutState({ expectedApp: "Ethereum" })).toEqual({ code: "timeout" });
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

  it("claims nothing when no scan ever ran (mocked transport, mid-session timeout)", () => {
    expect(
      classifyDeviceError(new SendApduTimeoutError("t"), {
        expectedApp: "Ethereum",
        rejectedContext: "open_app",
      }),
    ).toEqual({ code: "timeout" });
  });

  it("a re-enumeration failure cleared by a later success does not poison attribution", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("Error: LIBUSB_ERROR_NO_DEVICE"));
    recordUsbAccessSuccess();

    expect(
      classifyDeviceError(new SendApduTimeoutError("t"), {
        expectedApp: "Ethereum",
        rejectedContext: "open_app",
      }),
    ).toEqual({ code: "timeout", likelyCause: "app_not_open" });
  });

  it("claims nothing when enumeration itself never completed", () => {
    recordUsbAccessFailure(new Error("libusb init failed"));
    const error = discoveryFailure();
    expect(classifyDeviceError(error)).toEqual({
      code: "unknown",
      cause: error,
      likelyCause: "unknown",
    });
  });

  it("leaves unrelated errors on the unknown fallthrough", () => {
    recordScanCompleted();
    const other = new Error("something else");
    expect(classifyDeviceError(other)).toEqual({ code: "unknown", cause: other });
  });
});
