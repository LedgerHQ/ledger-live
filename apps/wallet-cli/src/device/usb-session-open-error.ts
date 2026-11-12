const NO_LEDGER_DEVICE_FOUND_MESSAGE = "No Ledger device found. Unlock the device and try again.";

/** Opening the USB session failed. The `cause` is the device stack's error, when there is one. */
export abstract class UsbSessionOpenError extends Error {
  protected constructor(message: string, cause: unknown) {
    super(message, cause === undefined ? undefined : { cause });
  }
}

/** Discovery produced no usable device. */
export class DeviceDiscoveryFailedError extends UsbSessionOpenError {
  constructor(cause?: unknown) {
    super(NO_LEDGER_DEVICE_FOUND_MESSAGE, cause);
    this.name = "DeviceDiscoveryFailedError";
  }
}

/**
 * Opening the session failed after a device had been discovered. The device stack's own message is
 * kept, since `dmk.connect()` rejects with a `GeneralDmkError` that has none of its own.
 */
export class DeviceConnectionFailedError extends UsbSessionOpenError {
  constructor(cause?: unknown) {
    super(underlyingMessageOf(cause) ?? "Could not open a session with the Ledger.", cause);
    this.name = "DeviceConnectionFailedError";
  }
}

function underlyingMessageOf(cause: unknown): string | undefined {
  if (cause instanceof Error) return cause.message;
  const { originalError } = (cause ?? {}) as { originalError?: unknown };
  if (originalError instanceof Error) return originalError.message;
  return undefined;
}
