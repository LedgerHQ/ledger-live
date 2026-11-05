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
  scanCompleted: boolean;
  ledgerVendorSeen: boolean;
  failure?: { kind: UsbAccessFailureKind; message: string };
};

let diagnostics: UsbAccessDiagnostics = { scanCompleted: false, ledgerVendorSeen: false };

export function resetUsbAccessDiagnostics(): void {
  diagnostics = { scanCompleted: false, ledgerVendorSeen: false };
}

export function readUsbAccessDiagnostics(): UsbAccessDiagnostics {
  return diagnostics;
}

export function recordScanStarted(): void {
  const { failure } = diagnostics;
  diagnostics = { scanCompleted: false, ledgerVendorSeen: false, ...(failure && { failure }) };
}

export function recordScanCompleted(): void {
  diagnostics = { ...diagnostics, scanCompleted: true };
}

export function recordLedgerVendorSeen(): void {
  diagnostics = { ...diagnostics, ledgerVendorSeen: true };
}

export function recordUsbAccessSuccess(): void {
  const { failure: _cleared, ...rest } = diagnostics;
  diagnostics = rest;
}

export function recordUsbAccessFailure(error: unknown): void {
  diagnostics = {
    ...diagnostics,
    failure: { kind: classifyUsbAccessFailure(error), message: usbErrorText(error) },
  };
}

function usbErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function usbErrorTokens(error: unknown): string {
  const parts: string[] = [];
  let node = error;
  for (let depth = 0; node != null && depth < 3; depth++) {
    if (typeof node === "string") {
      parts.push(node);
      break;
    }
    const { message, name, code, cause } = node as Record<string, unknown>;
    parts.push(...[message, name, code].filter(v => typeof v === "string"));
    node = cause;
  }
  return parts.join(" ");
}

export function classifyUsbAccessFailure(error: unknown): UsbAccessFailureKind {
  const text = usbErrorTokens(error);

  if (
    /LIBUSB_ERROR_ACCESS|EACCES|EPERM|NotAllowedError|SecurityError|ERROR_ACCESS_DENIED/i.test(text)
  ) {
    return "access_denied";
  }
  if (/LIBUSB_ERROR_BUSY|EBUSY/i.test(text)) {
    return "busy";
  }
  if (/LIBUSB_ERROR_NO_DEVICE|LIBUSB_ERROR_NOT_FOUND|ENOENT|ENODEV|NotFoundError/i.test(text)) {
    return "device_unreachable";
  }
  return "other";
}
