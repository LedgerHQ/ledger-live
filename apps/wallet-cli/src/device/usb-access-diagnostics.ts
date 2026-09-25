/**
 * Records *why* a USB device could not be reached, so the error the user finally sees can name a
 * likely cause instead of a generic timeout.
 *
 * The transport learns the real reason (a permission error, a device that exists but cannot be
 * opened) deep inside a scan whose only contract is "return the devices you found". By the time the
 * failure surfaces — sixty seconds later, as an rxjs timeout — the evidence is gone. So the
 * transport deposits it here on the way past, and `classifyDeviceError` reads it (LIVE-31394).
 *
 * Module-scoped mutable state: there is one DeviceManagementKit per CLI process, and the value is
 * diagnostic only — it never decides control flow, only the wording of an error.
 */

export type UsbAccessFailureKind =
  | "access_denied"
  | "device_unreachable"
  | "busy"
  /** Reached the device but failed for a reason we cannot attribute. */
  | "other";

export type UsbAccessDiagnostics = {
  /**
   * True once a USB scan ran to completion. Without it, an APDU timeout mid-session (where no scan
   * ever ran) would be misreported as "no device plugged in".
   */
  scanCompleted: boolean;
  ledgerVendorSeen: boolean;
  /**
   * `device` identifies which device the failure belongs to, so another Ledger opening successfully
   * cannot clear it.
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
 * On Linux, libusb enumerates by *reading* sysfs (which a sandbox permits) and only needs the
 * `/dev/bus/usb` node to *open* the device. So "we saw it but could not open it" means the host
 * blocked us, not that the device is missing — which is what makes `sandbox_blocking_usb`
 * distinguishable from `device_not_present`.
 */
export function recordLedgerVendorSeen(): void {
  diagnostics = { ...diagnostics, ledgerVendorSeen: true };
}

/**
 * Clear a recorded failure after USB demonstrably worked: opening an app makes the Ledger
 * re-enumerate, and a rescan racing that detach window throws `LIBUSB_ERROR_NO_DEVICE`. Without
 * this, that transient failure would be permanent and a later unconfirmed on-device prompt would be
 * blamed on a sandbox on a run where USB plainly worked.
 *
 * A keyed success clears only the failure it can prove is its own; a success with no key is a
 * connection-level success, which vouches for the whole link and clears regardless.
 */
export function recordUsbAccessSuccess(device?: string): void {
  const { failure } = diagnostics;
  if (failure === undefined) return;
  const provenToBeADifferentDevice = device !== undefined && failure.device !== device;
  if (provenToBeADifferentDevice) return;
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

/** Human-readable text for a recorded failure. DMK wrappers have no message, hence the `_tag`. */
function usbErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  const { message, _tag } = (error ?? {}) as { message?: unknown; _tag?: unknown };
  if (typeof message === "string" && message !== "") return message;
  if (typeof _tag === "string") return _tag;
  return String(error);
}

/**
 * The tokens one error contributes to classification: its message, `name` and `code`.
 *
 * `_tag` is deliberately excluded. A CamelCase DMK tag can contain an errno as a substring —
 * `DeviceBusyError` matches `/EBUSY/i` — so letting tags into the token text would bin errors by
 * accident rather than by evidence.
 */
function usbErrorTokens(error: unknown): string {
  if (typeof error === "string") return error;
  const { message, name, code } = (error ?? {}) as {
    message?: unknown;
    name?: unknown;
    code?: unknown;
  };
  return [message, name, code].filter(v => typeof v === "string").join(" ");
}

/**
 * Every classification token reachable from the error, joined.
 *
 * Two wrapper conventions have to be followed, not one: `DeviceDiscoveryFailedError` and node-usb
 * chain through `cause`, while DMK's `GeneralDmkError` subclasses (`NoAccessibleDeviceError`,
 * `ConnectionOpeningError`) are not `Error` instances at all — they implement `DmkError` and hold
 * the throwable on `originalError`. Following only `cause` stops at such a wrapper and loses the one
 * token that names the cause, degrading attribution to `unknown` (LIVE-31394).
 *
 * Every node contributes its own `name` and `code`, not just the root: node-usb's WebUSB layer
 * throws errors whose message carries no libusb token and whose evidence is the `name` alone.
 *
 * Breadth-first and depth-bounded, because either link can be cyclic.
 */
function usbErrorChainText(error: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let frontier: unknown[] = [error];
  for (let depth = 0; depth < 5 && frontier.length > 0; depth++) {
    const next: unknown[] = [];
    for (const node of frontier) {
      if (node == null || seen.has(node)) continue;
      seen.add(node);
      parts.push(usbErrorTokens(node));
      const { cause, originalError } = node as { cause?: unknown; originalError?: unknown };
      next.push(cause, originalError);
    }
    frontier = next;
  }
  return parts.join(" ");
}

/**
 * Map a raw USB/libusb throwable to a failure kind.
 *
 * Matching is on text as well as on `name`/`code` because the same condition reaches us in several
 * shapes: node-usb rethrows libusb status codes as plain `Error("LIBUSB_ERROR_ACCESS")`, sometimes
 * nested inside an `initialize error: …` wrapper, while the WebUSB layer raises DOMException
 * `NotAllowedError` and Node's fs-style errors carry `code: "EACCES"`.
 */
export function classifyUsbAccessFailure(error: unknown): UsbAccessFailureKind {
  const text = usbErrorChainText(error);

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
