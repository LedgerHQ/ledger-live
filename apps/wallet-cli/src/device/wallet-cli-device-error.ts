import { SendApduTimeoutError } from "@ledgerhq/device-management-kit";
import { LockedDeviceError, ManagerDeviceLockedError } from "@ledgerhq/errors";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";

function isSendApduTimeoutTagged(error: unknown): error is { _tag: "SendApduTimeoutError" } {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    (error as { _tag: string })._tag === "SendApduTimeoutError"
  );
}

/**
 * Maps device / transport errors to concise wallet-cli messages. Passes through unrelated errors.
 */
export function toWalletCliDeviceError(error: unknown): Error {
  if (error instanceof ManagerDeviceLockedError || error instanceof LockedDeviceError) {
    return new Error(
      "[wallet-cli] Device is locked. Unlock your Ledger with your PIN and try again.",
      { cause: error },
    );
  }

  if (error instanceof TransportStatusError) {
    const { statusCode } = error;
    if (statusCode === StatusCodes.LOCKED_DEVICE) {
      return new Error(
        "[wallet-cli] Device is locked. Unlock your Ledger with your PIN and try again.",
        { cause: error },
      );
    }
    if (statusCode === StatusCodes.SECURITY_STATUS_NOT_SATISFIED) {
      return new Error(
        "[wallet-cli] The device reported a security error (often the Ledger is locked or the operation is not allowed). Unlock the device and try again.",
        { cause: error },
      );
    }
    if (statusCode === StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED) {
      return new Error("[x] Transaction Cancelled: Rejected on device. No funds moved.", {
        cause: error,
      });
    }
    if (
      statusCode === StatusCodes.CLA_NOT_SUPPORTED ||
      statusCode === StatusCodes.INS_NOT_SUPPORTED
    ) {
      return new Error(
        "[wallet-cli] Could not execute the command on the app. Unlock the Ledger, open the correct app for this currency, and try again.",
        { cause: error },
      );
    }
  }

  if (error instanceof SendApduTimeoutError || isSendApduTimeoutTagged(error)) {
    return new Error(
      "[wallet-cli] Timed out talking to the Ledger over USB. The device may be waiting for your PIN, locked, or busy. Retry the command, check the cable, and make sure no other app is using the device.",
      { cause: error },
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}
