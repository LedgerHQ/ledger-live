import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  classifyUsbAccessFailure,
  readUsbAccessDiagnostics,
  recordLedgerVendorSeen,
  recordScanCompleted,
  recordScanStarted,
  recordUsbAccessFailure,
  recordUsbAccessSuccess,
  resetUsbAccessDiagnostics,
} from "./usb-access-diagnostics";

describe("classifyUsbAccessFailure", () => {
  it("maps permission refusals to access_denied", () => {
    expect(classifyUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"))).toBe("access_denied");
    expect(classifyUsbAccessFailure(Object.assign(new Error("nope"), { code: "EACCES" }))).toBe(
      "access_denied",
    );
    expect(
      classifyUsbAccessFailure(Object.assign(new Error("nope"), { name: "NotAllowedError" })),
    ).toBe("access_denied");
  });

  it("maps a nested libusb wrapper message, as node-usb actually throws it", () => {
    expect(
      classifyUsbAccessFailure(new Error("initialize error: Error: LIBUSB_ERROR_NO_DEVICE")),
    ).toBe("device_unreachable");
  });

  it("keeps busy separate from access_denied", () => {
    expect(classifyUsbAccessFailure(new Error("LIBUSB_ERROR_BUSY"))).toBe("busy");
  });

  it("does not treat a missing Windows driver as contention", () => {
    expect(classifyUsbAccessFailure(new Error("LIBUSB_ERROR_NOT_SUPPORTED"))).toBe("other");
  });

  it("falls back to other for an unattributable failure", () => {
    expect(classifyUsbAccessFailure(new Error("something else entirely"))).toBe("other");
    expect(classifyUsbAccessFailure(undefined)).toBe("other");
  });

  it("finds the status code nested in a cause chain, not just the outer message", () => {
    const wrapped = new Error("No Ledger device found.", {
      cause: new Error("initialize error", { cause: new Error("LIBUSB_ERROR_ACCESS") }),
    });
    expect(classifyUsbAccessFailure(wrapped)).toBe("access_denied");
  });

  it("reads a nested error's own code, not only the outermost one", () => {
    const nested = Object.assign(new Error("denied"), { code: "EACCES" });
    const wrapped = new Error("No Ledger device found.", { cause: nested });
    expect(classifyUsbAccessFailure(wrapped)).toBe("access_denied");
  });

  it("reads a nested error's own name, which is where the WebUSB layer puts the evidence", () => {
    const nested = Object.assign(new Error("permission denied"), { name: "NotAllowedError" });
    const wrapped = new Error("No Ledger device found.", { cause: nested });
    expect(classifyUsbAccessFailure(wrapped)).toBe("access_denied");
  });

  it("does not bin a DMK tag by an errno it merely contains as a substring", () => {
    expect(classifyUsbAccessFailure({ _tag: "DeviceBusyError" })).toBe("other");
  });

  it("survives a cyclic cause chain", () => {
    const a = new Error("outer");
    const b = new Error("inner", { cause: a });
    (a as { cause?: unknown }).cause = b;
    expect(classifyUsbAccessFailure(a)).toBe("other");
  });
});

describe("diagnostics record", () => {
  beforeEach(() => {
    resetUsbAccessDiagnostics();
  });

  afterEach(() => {
    resetUsbAccessDiagnostics();
  });

  it("starts empty", () => {
    expect(readUsbAccessDiagnostics()).toEqual({ scanCompleted: false, ledgerVendorSeen: false });
  });

  it("records the vendor sighting and the failure independently", () => {
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    const d = readUsbAccessDiagnostics();
    expect(d.ledgerVendorSeen).toBe(true);
    expect(d.failure).toEqual({ kind: "access_denied", message: "LIBUSB_ERROR_ACCESS" });
  });

  it("keeps the last failure when several devices fail", () => {
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_BUSY"));
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));

    expect(readUsbAccessDiagnostics().failure).toMatchObject({ kind: "access_denied" });
  });

  it("keeps a thrown string as the failure's message", () => {
    recordUsbAccessFailure("LIBUSB_ERROR_ACCESS");
    expect(readUsbAccessDiagnostics().failure).toEqual({
      kind: "access_denied",
      message: "LIBUSB_ERROR_ACCESS",
    });
  });

  it("tracks a completed scan separately from a vendor sighting", () => {
    recordScanCompleted();
    const d = readUsbAccessDiagnostics();
    expect(d.scanCompleted).toBe(true);
    expect(d.ledgerVendorSeen).toBe(false);
  });

  it("reset clears both, so a second command cannot inherit the first one's verdict", () => {
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    resetUsbAccessDiagnostics();
    expect(readUsbAccessDiagnostics()).toEqual({ scanCompleted: false, ledgerVendorSeen: false });
  });
});

describe("recordUsbAccessSuccess", () => {
  beforeEach(() => {
    resetUsbAccessDiagnostics();
  });

  afterEach(() => {
    resetUsbAccessDiagnostics();
  });

  it("clears a recorded failure while keeping what we learned about the bus", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_NO_DEVICE"));
    recordUsbAccessSuccess();

    const d = readUsbAccessDiagnostics();
    expect(d.failure).toBeUndefined();
    expect(d.scanCompleted).toBe(true);
    expect(d.ledgerVendorSeen).toBe(true);
  });
});

describe("recordScanStarted", () => {
  beforeEach(() => {
    resetUsbAccessDiagnostics();
  });

  afterEach(() => {
    resetUsbAccessDiagnostics();
  });

  it("forgets what the previous scan saw on the bus", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordScanStarted();

    expect(readUsbAccessDiagnostics()).toEqual({ scanCompleted: false, ledgerVendorSeen: false });
  });

  it("keeps a refusal from an earlier scan, since libusb drops a device it failed to open", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("initialize error: Error: LIBUSB_ERROR_NO_DEVICE"));
    recordScanStarted();
    recordScanCompleted();

    expect(readUsbAccessDiagnostics()).toEqual({
      scanCompleted: true,
      ledgerVendorSeen: false,
      failure: {
        kind: "device_unreachable",
        message: "initialize error: Error: LIBUSB_ERROR_NO_DEVICE",
      },
    });
  });
});
