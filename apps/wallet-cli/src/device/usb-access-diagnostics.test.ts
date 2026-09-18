import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  classifyUsbAccessFailure,
  readUsbAccessDiagnostics,
  recordLedgerVendorSeen,
  recordScanCompleted,
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
    // The real string observed under bubblewrap: node-usb wraps the status code in "initialize error".
    expect(
      classifyUsbAccessFailure(new Error("initialize error: Error: LIBUSB_ERROR_NO_DEVICE")),
    ).toBe("device_unreachable");
  });

  it("keeps busy separate from access_denied", () => {
    expect(classifyUsbAccessFailure(new Error("LIBUSB_ERROR_BUSY"))).toBe("busy");
  });

  it("does not treat a missing Windows driver as contention", () => {
    // LIBUSB_ERROR_NOT_SUPPORTED means no WinUSB driver is bound, not that something else holds
    // the device. Both kinds currently resolve to likely_cause "unknown", so this asserts the
    // classification rather than the envelope — it is what a future driver-specific hint hangs on.
    expect(classifyUsbAccessFailure(new Error("LIBUSB_ERROR_NOT_SUPPORTED"))).toBe("other");
  });

  it("falls back to other for an unattributable failure", () => {
    expect(classifyUsbAccessFailure(new Error("something else entirely"))).toBe("other");
    expect(classifyUsbAccessFailure(undefined)).toBe("other");
  });

  it("finds the status code nested in a cause chain, not just the outer message", () => {
    // Discovery and DMK both wrap the original throwable rather than interpolating its message.
    // Reading only the outer message loses the one token that names the cause.
    const wrapped = new Error("No Ledger device found.", {
      cause: new Error("initialize error", { cause: new Error("LIBUSB_ERROR_ACCESS") }),
    });
    expect(classifyUsbAccessFailure(wrapped)).toBe("access_denied");
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

  // Module-scoped state shared with every other test file in this process.
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

  it("one device succeeding does not clear another device's refusal", () => {
    // Two Ledgers on the bus: the host blocks the one the user is waiting on, the other opens
    // fine. The verdict must survive, or the blocked device is reported as `unknown`.
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"), "1:4:11415:20512");
    recordUsbAccessSuccess("1:7:11415:20512");

    expect(readUsbAccessDiagnostics().failure).toEqual({
      kind: "access_denied",
      message: "LIBUSB_ERROR_ACCESS",
      device: "1:4:11415:20512",
    });
  });

  it("the device that failed can clear its own failure", () => {
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_NO_DEVICE"), "1:4:11415:20512");
    recordUsbAccessSuccess("1:4:11415:20512");

    expect(readUsbAccessDiagnostics().failure).toBeUndefined();
  });

  it("a keyed success does not clear a failure of unknown ownership", () => {
    // The failure was recorded without a device key, so nothing proves this success belongs to it.
    // Clearing anyway would let one Ledger speak for another on a platform that cannot tell them
    // apart, which is the case the key exists to rule out.
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_ACCESS"));
    recordUsbAccessSuccess("1:4:11415:20512");

    expect(readUsbAccessDiagnostics().failure).toMatchObject({ kind: "access_denied" });
  });

  it("a connection-level success vouches for the whole link", () => {
    // No device key: this is the post-setupConnection success, which proves USB works outright.
    recordScanCompleted();
    recordLedgerVendorSeen();
    recordUsbAccessFailure(new Error("LIBUSB_ERROR_NO_DEVICE"), "1:4:11415:20512");
    recordUsbAccessSuccess();

    expect(readUsbAccessDiagnostics().failure).toBeUndefined();
  });
});
