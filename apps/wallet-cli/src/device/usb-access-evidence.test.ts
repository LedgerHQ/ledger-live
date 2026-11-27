import { describe, expect, it } from "bun:test";
import { NoAccessibleDeviceError, OpeningConnectionError } from "@ledgerhq/device-management-kit";
import { usbAccessEvidence, usbAccessHint, type UsbAccessFailureKind } from "./usb-access-evidence";

describe("usbAccessEvidence", () => {
  it.each([
    ["initialize error: Error: LIBUSB_ERROR_ACCESS", "LIBUSB_ERROR_ACCESS", "access_denied"],
    ["EACCES: permission denied", "EACCES", "access_denied"],
    ["claimInterface error: Error: LIBUSB_ERROR_BUSY", "LIBUSB_ERROR_BUSY", "busy"],
    [
      "initialize error: Error: LIBUSB_ERROR_NO_DEVICE",
      "LIBUSB_ERROR_NO_DEVICE",
      "device_unreachable",
    ],
    ["LIBUSB_ERROR_NOT_SUPPORTED", "LIBUSB_ERROR_NOT_SUPPORTED", "other"],
    ["open error: permission denied (errno 13)", "errno 13", "access_denied"],
    ["open error: failed to open device (error 5)", "error 5", "access_denied"],
    ["open error: failed to open device (error 0xe00002c1)", "error 0xe00002c1", "access_denied"],
    ["claimInterface error: interface is busy (errno 16)", "interface is busy", "busy"],
    [
      "claimInterface error: could not open interface for exclusive access (error 0xe00002c5)",
      "error 0xe00002c5",
      "busy",
    ],
    ["open error: device disconnected (errno 19)", "device disconnected", "device_unreachable"],
    ["open error: failed to open device (error 31)", "error 31", "device_unreachable"],
    [
      "open error: failed to open device (error 0xe00002c0)",
      "error 0xe00002c0",
      "device_unreachable",
    ],
    ["open error: failed to open device (errno 5)", "errno 5", "other"],
    ["open error: failed to open device (error 0xe00002bc)", "error 0xe00002bc", "other"],
  ] as const)("%s → %s (%s)", (message, error, kind) => {
    expect(usbAccessEvidence(new Error(message))).toEqual({ error, kind });
  });

  it("follows cause and a DMK originalError down to the libusb error", () => {
    expect(
      usbAccessEvidence(new Error("open failed", { cause: new Error("LIBUSB_ERROR_BUSY") })),
    ).toEqual({ error: "LIBUSB_ERROR_BUSY", kind: "busy" });
    expect(usbAccessEvidence(new OpeningConnectionError(new Error("LIBUSB_ERROR_ACCESS")))).toEqual(
      { error: "LIBUSB_ERROR_ACCESS", kind: "access_denied" },
    );
  });

  it("reads originalError when cause is set too", () => {
    const transportError = Object.assign(
      new NoAccessibleDeviceError(new Error("LIBUSB_ERROR_BUSY")),
      {
        cause: new Error("discovery failed"),
      },
    );

    expect(usbAccessEvidence(transportError)).toEqual({ error: "LIBUSB_ERROR_BUSY", kind: "busy" });
  });

  it("names the error that decided the kind, wherever it sits in the chain", () => {
    const error = new Error("LIBUSB_ERROR_IO", { cause: new Error("EACCES: permission denied") });

    expect(usbAccessEvidence(error)).toEqual({ error: "EACCES", kind: "access_denied" });
  });

  it("reports nothing when the chain names no libusb or OS error", () => {
    expect(usbAccessEvidence(new Error("Timeout has occurred"))).toBeUndefined();
    expect(usbAccessEvidence(undefined)).toBeUndefined();
  });
});

describe("usbAccessHint", () => {
  it.each([
    ["access_denied", "sandbox, udev rules or permissions"],
    ["access_denied", "another process holds it"],
    ["device_unreachable", "/dev/bus/usb"],
    ["busy", "Ledger Live"],
  ] as const)("%s names its likely fixes", (kind, expected) => {
    expect(usbAccessHint(kind)).toContain(expected);
  });

  it("gives no hint for an error it cannot interpret", () => {
    expect(usbAccessHint("other" satisfies UsbAccessFailureKind)).toBeUndefined();
  });
});
