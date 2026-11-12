import { describe, expect, it } from "bun:test";
import { OpeningConnectionError } from "@ledgerhq/device-management-kit";
import type { NodeWebUsbAccessSnapshot, NodeWebUsbOpenFailure } from "./node-webusb";
import {
  classifyUsbAccessFailure,
  usbAccessEvidence,
  usbAccessHint,
  type UsbAccessFailureKind,
} from "./usb-access-evidence";

function snapshotOf(...failures: Array<[string, NodeWebUsbOpenFailure]>): NodeWebUsbAccessSnapshot {
  return { openFailures: new Map(failures) };
}

describe("classifyUsbAccessFailure", () => {
  it.each([
    ["initialize error: Error: LIBUSB_ERROR_ACCESS", "access_denied"],
    ["EACCES: permission denied", "access_denied"],
    ["claimInterface error: Error: LIBUSB_ERROR_BUSY", "busy"],
    ["initialize error: Error: LIBUSB_ERROR_NO_DEVICE", "device_unreachable"],
    ["LIBUSB_ERROR_NOT_SUPPORTED", "other"],
  ] as const)("%s → %s", (message, kind) => {
    expect(classifyUsbAccessFailure(new Error(message))).toBe(kind);
  });

  it("follows cause and a DMK originalError down to the libusb error", () => {
    expect(
      classifyUsbAccessFailure(new Error("open failed", { cause: new Error("LIBUSB_ERROR_BUSY") })),
    ).toBe("busy");
    expect(
      classifyUsbAccessFailure(new OpeningConnectionError(new Error("LIBUSB_ERROR_ACCESS"))),
    ).toBe("access_denied");
  });
});

describe("usbAccessEvidence", () => {
  it("reports the libusb error name of the latest failure", () => {
    const evidence = usbAccessEvidence(
      snapshotOf(
        ["1-2", { error: new Error("LIBUSB_ERROR_BUSY"), detached: false }],
        ["1-3", { error: new Error("open error: Error: LIBUSB_ERROR_ACCESS"), detached: false }],
      ),
    );

    expect(evidence).toEqual({ error: "LIBUSB_ERROR_ACCESS", kind: "access_denied" });
  });

  it("keeps a no-device failure after its detach, which libusb fires itself", () => {
    const evidence = usbAccessEvidence(
      snapshotOf([
        "3-4",
        { error: new Error("initialize error: Error: LIBUSB_ERROR_NO_DEVICE"), detached: true },
      ]),
    );

    expect(evidence).toEqual({ error: "LIBUSB_ERROR_NO_DEVICE", kind: "device_unreachable" });
  });

  it("drops any other failure once its device was detached", () => {
    const snapshot = snapshotOf(
      ["1-2", { error: new Error("LIBUSB_ERROR_BUSY"), detached: false }],
      ["1-3", { error: new Error("LIBUSB_ERROR_ACCESS"), detached: true }],
    );

    expect(usbAccessEvidence(snapshot)).toEqual({ error: "LIBUSB_ERROR_BUSY", kind: "busy" });
    expect(
      usbAccessEvidence(snapshotOf(["1-3", { error: new Error("EPERM"), detached: true }])),
    ).toBeUndefined();
  });

  it("falls back to the error message when it names no libusb or OS error", () => {
    const evidence = usbAccessEvidence(
      snapshotOf(["1-2", { error: new Error("libusb init failed"), detached: false }]),
    );

    expect(evidence).toEqual({ error: "libusb init failed", kind: "other" });
  });

  it("reports nothing without a failure", () => {
    expect(usbAccessEvidence(snapshotOf())).toBeUndefined();
  });
});

describe("usbAccessHint", () => {
  it.each([
    ["access_denied", "sandbox, udev rules or permissions"],
    ["device_unreachable", "/dev/bus/usb"],
    ["busy", "Ledger Live"],
  ] as const)("%s names its likely fixes", (kind, expected) => {
    expect(usbAccessHint(kind)).toContain(expected);
  });

  it("gives no hint for an error it cannot interpret", () => {
    expect(usbAccessHint("other" satisfies UsbAccessFailureKind)).toBeUndefined();
  });
});
