/**
 * Shared analytics-lifecycle plumbing for command handlers.
 *
 * `withTracking` owns the started/succeeded/rejected/failed control flow so every command emits the
 * same event sequence and no handler re-implements the try/catch by hand. `trackErrorInfo` is the
 * single place that classifies a thrown value into an analytics-safe `{ errorCode, errorMessage }`.
 */

import { WalletCliDeviceError } from "../device/wallet-cli-device-error";

/** EVM address: `0x` followed by 40 hex chars. */
const EVM_ADDRESS_RE = /0x[0-9a-fA-F]{40}/g;
/** Base58 public key (Solana addresses / stake / vote accounts), 32-44 chars. */
const BASE58_ADDRESS_RE = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;

/**
 * Strip on-chain addresses from a free-text error message before it reaches analytics. wallet-cli
 * deliberately anonymizes analytics (fixed user id, `ip: 0.0.0.0`), but the earn safety guards embed
 * wallet/target addresses in their messages (see `eth-vault-policy.ts`), so redact them here so raw
 * addresses never leave the machine.
 */
export function redactAddresses(message: string): string {
  return message.replace(EVM_ADDRESS_RE, "<address>").replace(BASE58_ADDRESS_RE, "<address>");
}

export type TrackErrorInfo = { errorCode: string; errorMessage: string };

/**
 * Classify a thrown value into an analytics-safe payload: a stable `errorCode` (device state code /
 * error name / "unknown") and an address-redacted `errorMessage`.
 */
export function trackErrorInfo(err: unknown): TrackErrorInfo {
  let errorCode: string;
  if (err instanceof WalletCliDeviceError) {
    errorCode = err.state.code;
  } else if (err instanceof Error) {
    errorCode = err.name;
  } else {
    errorCode = "unknown";
  }
  const rawMessage = err instanceof Error ? err.message : String(err);
  return { errorCode, errorMessage: redactAddresses(rawMessage) };
}

export type TrackedRun<T> = {
  /** Fired once, before `work()` runs. */
  onStart?: () => void;
  /** Fired with the resolved value when `work()` succeeds. */
  onSuccess?: (result: T) => void;
  /** Fired when `work()` throws a user device-rejection (takes precedence over `onFailed`). */
  onRejected?: (err: WalletCliDeviceError) => void;
  /** Fired for any non-rejection failure (or a rejection when no `onRejected` is provided). */
  onFailed?: (err: unknown, info: TrackErrorInfo) => void;
};

/**
 * Run `work()` wrapped in the standard analytics lifecycle:
 *   onStart → work() → onSuccess                                  (success)
 *   onStart → work() throws → onRejected (device rejection)       then rethrow
 *   onStart → work() throws → onFailed  (anything else)           then rethrow
 *
 * A device rejection fires `onRejected` XOR `onFailed` (never both) so rejections are not
 * double-counted in the failure funnel. The original error is always rethrown so the caller's
 * `out.run` device-error handling still runs. Rendering the result is intentionally NOT part of the
 * tracked work — call it on the returned value so a render error cannot emit a spurious failure for
 * an operation that already succeeded.
 */
export async function withTracking<T>(cfg: TrackedRun<T>, work: () => Promise<T>): Promise<T> {
  cfg.onStart?.();
  try {
    const result = await work();
    cfg.onSuccess?.(result);
    return result;
  } catch (err) {
    const rejection = WalletCliDeviceError.fromKnownDeviceError(err);
    if (rejection?.state.code === "rejected" && cfg.onRejected) {
      cfg.onRejected(rejection);
    } else {
      cfg.onFailed?.(err, trackErrorInfo(err));
    }
    throw err;
  }
}
