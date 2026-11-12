import type { NodeWebUsbAccessSnapshot } from "./node-webusb";

const NO_LEDGER_DEVICE_FOUND_MESSAGE = "No Ledger device found. Unlock the device and try again.";

type UsbSessionOpenErrorInput = {
  cause?: unknown;
  /** Read when the open failed: the transport is torn down before the error is reported. */
  usbAccess?: NodeWebUsbAccessSnapshot;
};

/** Opening the USB session failed. Carries what the transport saw while opening the Ledger. */
export abstract class UsbSessionOpenError extends Error {
  readonly usbAccess: NodeWebUsbAccessSnapshot | undefined;

  protected constructor(message: string, { cause, usbAccess }: UsbSessionOpenErrorInput) {
    super(message, cause === undefined ? undefined : { cause });
    this.usbAccess = usbAccess;
  }
}

/** Discovery produced no usable device. */
export class DeviceDiscoveryFailedError extends UsbSessionOpenError {
  constructor(input: UsbSessionOpenErrorInput = {}) {
    super(NO_LEDGER_DEVICE_FOUND_MESSAGE, input);
    this.name = "DeviceDiscoveryFailedError";
  }
}

/**
 * Opening the session failed after a device had been discovered. The device stack's own message is
 * kept, since `dmk.connect()` rejects with a `GeneralDmkError` that has none of its own.
 */
export class DeviceConnectionFailedError extends UsbSessionOpenError {
  constructor(input: UsbSessionOpenErrorInput = {}) {
    super(underlyingMessageOf(input.cause) ?? "Could not open a session with the Ledger.", input);
    this.name = "DeviceConnectionFailedError";
  }
}

function underlyingMessageOf(cause: unknown): string | undefined {
  if (cause instanceof Error) return cause.message;
  const { originalError } = (cause ?? {}) as { originalError?: unknown };
  if (originalError instanceof Error) return originalError.message;
  return undefined;
}
