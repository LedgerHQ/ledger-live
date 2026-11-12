export type UsbAccessFailureKind = "access_denied" | "device_unreachable" | "busy" | "other";

/** The failed USB open behind a failed connection, reported as `usb_access_error` plus a hint. */
export type UsbAccessEvidence = {
  /** The libusb or OS error name, e.g. `LIBUSB_ERROR_ACCESS`. */
  error: string;
  kind: UsbAccessFailureKind;
};

/** In priority order: the first kind whose error appears anywhere in the chain wins. */
const USB_ERROR_NAMES_BY_KIND: ReadonlyArray<readonly [UsbAccessFailureKind, RegExp]> = [
  [
    "access_denied",
    /\b(LIBUSB_ERROR_ACCESS|EACCES|EPERM|ERROR_ACCESS_DENIED|NotAllowedError|SecurityError)\b/,
  ],
  ["busy", /\b(LIBUSB_ERROR_BUSY|EBUSY)\b/],
  [
    "device_unreachable",
    /\b(LIBUSB_ERROR_NO_DEVICE|LIBUSB_ERROR_NOT_FOUND|ENOENT|ENODEV|NotFoundError)\b/,
  ],
  ["other", /\b(LIBUSB_ERROR_[A-Z_]+)\b/],
];
const ERROR_CHAIN_MAX_DEPTH = 4;

/** The libusb or OS error a failed USB open carries, if the error chain names one. */
export function usbAccessEvidence(error: unknown): UsbAccessEvidence | undefined {
  const text = errorChainStrings(error, 0).join(" ");
  for (const [kind, pattern] of USB_ERROR_NAMES_BY_KIND) {
    const name = pattern.exec(text)?.[1];
    if (name) return { error: name, kind };
  }
  return undefined;
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

/**
 * Messages, names and tags down the error chain. node-usb nests through `cause`, DMK's
 * `GeneralDmkError` through `originalError`, and an error can carry both.
 */
function errorChainStrings(node: unknown, depth: number): string[] {
  if (node == null || depth >= ERROR_CHAIN_MAX_DEPTH) return [];
  if (typeof node === "string") return [node];
  if (typeof node !== "object") return [];
  const { message, name, code, _tag, cause, originalError } = node as Record<string, unknown>;
  return [
    ...[message, name, code, _tag].filter((v): v is string => typeof v === "string" && v !== ""),
    ...errorChainStrings(cause, depth + 1),
    ...errorChainStrings(originalError, depth + 1),
  ];
}
