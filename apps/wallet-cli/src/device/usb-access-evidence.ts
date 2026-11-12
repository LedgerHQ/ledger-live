import type { NodeWebUsbAccessSnapshot } from "./node-webusb";

export type UsbAccessFailureKind = "access_denied" | "device_unreachable" | "busy" | "other";

/** The failed USB open behind a failed connection, reported as `usb_access_error` plus a hint. */
export type UsbAccessEvidence = {
  /** The libusb or OS error name, e.g. `LIBUSB_ERROR_ACCESS`; the error message when it has none. */
  error: string;
  kind: UsbAccessFailureKind;
};

const USB_ERROR_NAME =
  /\b(LIBUSB_ERROR_[A-Z_]+|EACCES|EPERM|EBUSY|ENOENT|ENODEV|ERROR_ACCESS_DENIED|NotAllowedError|SecurityError|NotFoundError)\b/;
const ERROR_CHAIN_MAX_DEPTH = 4;

/**
 * The latest failed open that still applies. A failure followed by a detach means the Ledger was
 * unplugged, except when the open failed with "no device": on Linux libusb fires that detach itself.
 */
export function usbAccessEvidence(
  snapshot: NodeWebUsbAccessSnapshot,
): UsbAccessEvidence | undefined {
  const latest = [...snapshot.openFailures.values()]
    .map(failure => ({ failure, kind: classifyUsbAccessFailure(failure.error) }))
    .filter(({ failure, kind }) => !failure.detached || kind === "device_unreachable")
    .at(-1);
  return latest && { error: usbErrorName(latest.failure.error), kind: latest.kind };
}

export function usbAccessHint(kind: UsbAccessFailureKind): string | undefined {
  switch (kind) {
    case "access_denied":
      return "The host refused USB access to the Ledger (sandbox, udev rules or permissions).";
    case "device_unreachable":
      return "The Ledger was listed but could not be opened: a sandbox without /dev/bus/usb, or the Ledger was unplugged.";
    case "busy":
      return "Another process holds the Ledger (Ledger Live, or a browser tab using WebUSB). Close it and retry.";
    case "other":
      return undefined;
  }
}

export function classifyUsbAccessFailure(error: unknown): UsbAccessFailureKind {
  const text = errorChainStrings(error).join(" ");
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

function usbErrorName(error: unknown): string {
  const strings = errorChainStrings(error);
  return USB_ERROR_NAME.exec(strings.join(" "))?.[1] ?? strings[0] ?? String(error);
}

/**
 * Messages, names and tags down the error chain. node-usb nests through `cause`, DMK's
 * `GeneralDmkError` through `originalError`.
 */
function errorChainStrings(error: unknown): string[] {
  const strings: string[] = [];
  let node = error;
  for (let depth = 0; node != null && depth < ERROR_CHAIN_MAX_DEPTH; depth++) {
    if (typeof node !== "object") {
      strings.push(String(node));
      break;
    }
    const { message, name, code, _tag, cause, originalError } = node as Record<string, unknown>;
    strings.push(
      ...[message, name, code, _tag].filter((v): v is string => typeof v === "string" && v !== ""),
    );
    node = cause ?? originalError;
  }
  return strings;
}
