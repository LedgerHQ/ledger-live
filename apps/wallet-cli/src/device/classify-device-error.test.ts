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

/**
 * The real class, not a hand-made shape: `USB_UNREACHABLE_NAMES` matches on `name`, so a rename
 * here has to break these tests rather than silently stop matching in production.
 */
const discoveryFailure = (cause?: unknown) => new DeviceDiscoveryFailedError(cause);

describe("USB failure attribution (LIVE-31394)", () => {
  beforeEach(() => {
    resetUsbAccessDiagnostics();
  });

  // Module-scoped state shared with every other test file in this process.
  afterEach(() => {
    resetUsbAccessDiagnostics();
  });

  it("a scan that saw no Ledger → disconnected, carrying the attribution", () => {
    recordScanCompleted();
    // `disconnected` keeps exit code 3, but the attribution rides along so the JSON envelope can
    // still publish `likely_cause` and `docs` for the commonest failure of all.
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
    // macOS seatbelt can block enumeration itself; EACCES is unambiguous even with no sighting.
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
    // NodeWebUsbApduSender raises OpeningConnectionError for ordinary transfers too ("Device not
    // connected", a bad transferIn/transferOut status). Matching that tag would turn a broken APDU
    // exchange into a timeout blamed on the host, so it stays on the unknown fallthrough.
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    const midSession = new OpeningConnectionError("Device not connected");
    expect(classifyDeviceError(midSession)).toEqual({ code: "unknown", cause: midSession });
  });

  it("attributes a failure to open the session, which is unambiguous", () => {
    // The initial open is wrapped at its source precisely because the DMK tag is not specific.
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

  it("a transient failure cleared by a later success does not poison attribution", () => {
    // Opening an app makes the Ledger re-enumerate; a rescan racing that detach window throws
    // LIBUSB_ERROR_NO_DEVICE. Without the success reset, the next unconfirmed on-device prompt
    // would be blamed on the sandbox and the agent told to disable a bypass that was already on.
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("Error: LIBUSB_ERROR_NO_DEVICE"));
    recordUsbAccessSuccess();

    expect(classifyDeviceError(new SendApduTimeoutError("t"), { expectedApp: "Ethereum" })).toEqual(
      { code: "timeout", likelyCause: "app_not_open" },
    );
  });

  it("claims nothing when enumeration itself never completed", () => {
    // getDeviceList threw: we never looked, so "no device" is not a conclusion we may draw.
    recordUsbAccessFailure(new Error("libusb init failed"));
    expect(classifyDeviceError(discoveryFailure())).toEqual({ code: "timeout" });
  });

  it("classifies the wrapped cause when the transport recorded nothing itself", () => {
    // Discovery fails above the transport, so the only evidence is the error's own cause chain.
    recordScanCompleted();
    recordLedgerVendorSeen();
    expect(classifyDeviceError(discoveryFailure(new Error("LIBUSB_ERROR_ACCESS")))).toEqual({
      code: "timeout",
      likelyCause: "sandbox_blocking_usb",
    });
  });

  it("never blames the app for a timeout while signing", () => {
    // `send` sets expectedApp for the whole flow, so a timeout on the approval screen used to be
    // reported as app_not_open — telling the user to open an app that was already open.
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
