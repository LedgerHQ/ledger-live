import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { EthAppPleaseEnableContractData } from "@ledgerhq/live-signer-evm/errors";

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Compose `<_tag> (code: <SW>) - <message>` from whichever DMK fields
 * are populated, falling back to the per-intent label when the error
 * shape is empty. Reused by every typed branch so the constructor
 * message of `LockedDeviceError` / `UserRefusedOnDevice` / etc. always
 * carries the same DMK-sourced detail logs/Sentry receive in the
 * default branch — no hardcoded copy lives in the wallet-side helper.
 */
function formatDmkErrorMessage(record: Record<string, unknown>, fallbackMessage: string): string {
  const tag = readString(record, "_tag");
  const errorCode = readString(record, "errorCode");
  const message = readString(record, "message");
  const parts = [
    tag ?? fallbackMessage,
    errorCode ? `(code: ${errorCode})` : null,
    message ? `- ${message}` : null,
  ].filter((part): part is string => part !== null);
  return parts.join(" ");
}

/**
 * Map a DMK `DeviceActionState` error into an actionable `Error`.
 *
 * Three concerns the wallet-side device-intent jobs share:
 *
 * 1. **Typed-error continuity** — for the well-known APDU status words
 *    the rest of ledger-live already speaks (`5515` →
 *    {@link LockedDeviceError}, `6985` → {@link UserRefusedOnDevice},
 *    `6a80` → {@link EthAppPleaseEnableContractData}) we return the
 *    same classes `DmkSignerEth._mapError` returns, so hosts can
 *    `instanceof`-branch instead of string-matching error messages.
 * 2. **Structured-info retention** — every eth-app APDU failure DMK
 *    surfaces shares the same `_tag: "EthAppCommandError"`. The
 *    distinguishing info lives in `errorCode` (the SW) and `message`
 *    (human-readable). We pass the composed string into every typed
 *    constructor so logs/Sentry receive the same DMK-sourced detail
 *    regardless of which branch fires (no hardcoded copy here).
 * 3. **Cause continuity** — when DMK ships `originalError`, we forward
 *    it as the `cause` of the returned `Error` so stack traces and
 *    error chains continue to unwind in logs.
 *
 * `fallbackMessage` is the per-intent label used when DMK didn't ship a
 * `_tag` we can lean on (e.g. `"Sign approval failed"`,
 * `"Sign swap failed"`, `"Sign typed data failed"`).
 */
export function mapDmkSignerError(error: unknown, fallbackMessage: string): Error {
  if (!isObjectLike(error)) {
    return new Error(fallbackMessage, { cause: error });
  }

  const message = formatDmkErrorMessage(error, fallbackMessage);

  switch (readString(error, "errorCode")) {
    case "5515":
      return new LockedDeviceError(message);
    case "6985":
      return new UserRefusedOnDevice(message);
    case "6a80":
      return new EthAppPleaseEnableContractData(message);
  }

  return new Error(message, { cause: error.originalError ?? error });
}
