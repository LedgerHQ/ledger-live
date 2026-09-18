/**
 * Records *why* a USB device could not be reached, so the error the user finally sees can name a
 * likely cause instead of a generic timeout.
 *
 * The problem this solves: the transport learns the real reason (a permission error, a device that
 * exists but cannot be opened) deep inside a scan whose only contract is "return the devices you
 * found". By the time the failure surfaces — sixty seconds later, as an rxjs timeout — the evidence
 * is gone. So the transport deposits it here on the way past, and `classifyDeviceError` reads it.
 *
 * Deliberately module-scoped mutable state. `register-dmk-transport.ts` documents that there is one
 * DeviceManagementKit per CLI process, and the value is diagnostic only: it never decides control
 * flow, only the wording of an error. `resetUsbAccessDiagnostics()` clears it when a transport is
 * built so a second command in the same process cannot inherit the first one's verdict.
 */

/** What went wrong when we tried to reach a device we could see. */
export type UsbAccessFailureKind =
  /** The OS refused access — EACCES / LIBUSB_ERROR_ACCESS / NotAllowedError. */
  | "access_denied"
  /** The device node was not there to open (a sandbox with a minimal /dev does this). */
  | "device_unreachable"
  /** Another process holds the interface — LIBUSB_ERROR_BUSY. */
  | "busy"
  /** Reached the device but failed for a reason we cannot attribute. */
  | "other";

export type UsbAccessDiagnostics = {
  /**
   * True once a USB scan ran to completion. Distinguishes "we looked and saw no Ledger" from "we
   * never looked" (a mocked transport, or a session established before the scan) — without it, an
   * APDU timeout mid-session would be misreported as "no device plugged in".
   */
  scanCompleted: boolean;
  /** True once a device with Ledger's vendor id appeared in the raw USB device list. */
  ledgerVendorSeen: boolean;
  /**
   * The last failure recorded while trying to reach a Ledger, if any. `device` identifies which
   * device it belongs to, so a second Ledger opening successfully cannot clear it.
   */
  failure?: { kind: UsbAccessFailureKind; message: string; device?: string };
};

let diagnostics: UsbAccessDiagnostics = { scanCompleted: false, ledgerVendorSeen: false };

export function resetUsbAccessDiagnostics(): void {
  diagnostics = { scanCompleted: false, ledgerVendorSeen: false };
}

export function readUsbAccessDiagnostics(): UsbAccessDiagnostics {
  return diagnostics;
}

/**
 * Note that the OS enumerated a Ledger. This is the discriminator that makes
 * `sandbox_blocking_usb` distinguishable from `device_not_present`: on Linux, libusb enumerates by
 * *reading* sysfs (which a sandbox permits) and only needs the `/dev/bus/usb` node to *open* the
 * device. So "we saw it but could not open it" means the host blocked us, not that the device is
 * missing.
 */
export function recordLedgerVendorSeen(): void {
  diagnostics = { ...diagnostics, ledgerVendorSeen: true };
}

/**
 * Clear a recorded failure after USB demonstrably worked.
 *
 * Without this, a *transient* failure is permanent: opening an app makes the Ledger re-enumerate,
 * and a rescan racing that detach window throws `LIBUSB_ERROR_NO_DEVICE`. A later unconfirmed
 * on-device prompt would then be attributed to `sandbox_blocking_usb` and the agent told to disable
 * a sandbox on a run where USB plainly worked.
 *
 * `device` scopes the clear to the device that just succeeded. Without it, two Ledgers on the bus
 * let the second one's success erase the first one's refusal, reporting `unknown` for a host that
 * is genuinely blocking the device the user is waiting on. A success with no device key is a
 * connection-level success, which vouches for the whole link and clears regardless; callers that
 * merely opened one device must pass its key, and must not call at all when they do not have one.
 */
export function recordUsbAccessSuccess(device?: string): void {
  const { failure } = diagnostics;
  if (failure === undefined) return;
  // A keyed success clears only the failure it can prove is its own. Anything looser lets one
  // device speak for another, which is what the key is for.
  if (device !== undefined && failure.device !== device) return;
  const { failure: _cleared, ...rest } = diagnostics;
  diagnostics = rest;
}

export function recordScanCompleted(): void {
  diagnostics = { ...diagnostics, scanCompleted: true };
}

export function recordUsbAccessFailure(error: unknown, device?: string): void {
  diagnostics = {
    ...diagnostics,
    failure: {
      kind: classifyUsbAccessFailure(error),
      message: usbErrorText(error),
      ...(device === undefined ? {} : { device }),
    },
  };
}

function usbErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

/**
 * Every message in the error's `cause` chain, joined.
 *
 * The libusb status code is not always in the top-level message: `DeviceDiscoveryFailedError` and
 * DMK's `OpeningConnectionError` both wrap the original throwable as `cause`, and node-usb nests
 * its own wrappers. Classifying only the outer message loses the one token that names the cause
 * and silently degrades attribution to `unknown` (LIVE-31394). Depth-bounded — a `cause` chain can
 * be cyclic.
 */
function usbErrorChainText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current != null && depth < 5; depth++) {
    parts.push(usbErrorText(current));
    if (!(current instanceof Error)) break;
    current = current.cause;
  }
  return parts.join(" ");
}

/**
 * Map a raw USB/libusb throwable to a failure kind.
 *
 * Matching is on text as well as on `name`/`code` because the same condition reaches us in several
 * shapes: node-usb rethrows libusb status codes as plain `Error("LIBUSB_ERROR_ACCESS")`, sometimes
 * nested inside an `initialize error: …` wrapper, while the WebUSB layer raises DOMException
 * `NotAllowedError` and Node's fs-style errors carry `code: "EACCES"`. The whole `cause` chain is
 * searched, not just the outer message — see `usbErrorChainText`.
 */
export function classifyUsbAccessFailure(error: unknown): UsbAccessFailureKind {
  const name = (error as { name?: unknown })?.name;
  const code = (error as { code?: unknown })?.code;
  const text = `${usbErrorChainText(error)} ${typeof name === "string" ? name : ""} ${
    typeof code === "string" ? code : ""
  }`;

  if (
    /LIBUSB_ERROR_ACCESS|EACCES|EPERM|NotAllowedError|SecurityError|ERROR_ACCESS_DENIED/i.test(text)
  ) {
    return "access_denied";
  }
  // Contention only. LIBUSB_ERROR_NOT_SUPPORTED is deliberately absent: on Windows it means no
  // WinUSB driver is bound to the interface, which is not contention and must not short-circuit
  // attribution to "unknown".
  if (/LIBUSB_ERROR_BUSY|EBUSY/i.test(text)) {
    return "busy";
  }
  if (/LIBUSB_ERROR_NO_DEVICE|LIBUSB_ERROR_NOT_FOUND|ENOENT|ENODEV|NotFoundError/i.test(text)) {
    return "device_unreachable";
  }
  return "other";
}
