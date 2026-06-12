/**
 * WalletCliError — classified, machine-actionable failures beyond the device-state taxonomy.
 *
 * Device failures already carry a `DeviceState` (via `WalletCliDeviceError`); this class covers
 * everything else an agent or script needs to dispatch on without parsing prose: usage mistakes
 * (bad flags / commands / transports), local resolution failures (unknown session label, corrupt
 * session file), and device selection failures (none found, several candidates).
 *
 * Every code maps to a fixed exit code and `retryable` flag (see
 * {@link WALLET_CLI_ERROR_DEFAULTS}), surfaced in the JSON error envelope as
 * `{ok:false, error:{command, code, message, retryable, hint?, details?}}` by `output.ts`.
 */

import {
  DEVICE_EXIT_CODES,
  DEVICE_STATE_RETRYABLE,
  type DeviceStateCode,
} from "../device/device-state";

/** Exit code for usage errors (bad flags, commands, selectors) — BSD sysexits EX_USAGE. */
export const USAGE_EXIT_CODE = 64;

export type WalletCliErrorCode =
  // Device codes — mirror the DeviceState taxonomy so JSON consumers see one namespace.
  | DeviceStateCode
  // Usage codes — the invocation itself was wrong; fix the command line and reissue.
  | "unknown_flag"
  | "invalid_flag_value"
  | "missing_required_flag"
  | "unknown_command"
  | "invalid_transport"
  // Resolution codes — local lookups or preconditions failed before any signing work.
  | "account_not_found"
  | "raw_descriptor_rejected"
  | "session_corrupt"
  | "device_not_found"
  | "device_ambiguous"
  | "ble_dependency_missing"
  | "swap_quotes_unavailable";

/**
 * Per-code defaults: the process exit code and whether retrying the same invocation can
 * succeed once the underlying condition clears (device unlocked, cable replugged, …).
 * Device codes reuse the device-state taxonomy verbatim so `$?` means the same thing
 * whether the failure was classified as a DeviceState or a WalletCliError.
 */
export const WALLET_CLI_ERROR_DEFAULTS: Record<
  WalletCliErrorCode,
  { exitCode: number; retryable: boolean }
> = {
  // Device codes (awaiting_approval / exchange_app_needed are non-terminal and never exit
  // by themselves; they keep the success exit code for completeness).
  disconnected: {
    exitCode: DEVICE_EXIT_CODES.disconnected,
    retryable: DEVICE_STATE_RETRYABLE.disconnected,
  },
  wrong_app: { exitCode: DEVICE_EXIT_CODES.wrong_app, retryable: DEVICE_STATE_RETRYABLE.wrong_app },
  awaiting_approval: {
    exitCode: DEVICE_EXIT_CODES.success,
    retryable: DEVICE_STATE_RETRYABLE.awaiting_approval,
  },
  rejected: { exitCode: DEVICE_EXIT_CODES.rejected, retryable: DEVICE_STATE_RETRYABLE.rejected },
  exchange_app_needed: {
    exitCode: DEVICE_EXIT_CODES.success,
    retryable: DEVICE_STATE_RETRYABLE.exchange_app_needed,
  },
  locked: { exitCode: DEVICE_EXIT_CODES.locked, retryable: DEVICE_STATE_RETRYABLE.locked },
  app_not_installed: {
    exitCode: DEVICE_EXIT_CODES.app_not_installed,
    retryable: DEVICE_STATE_RETRYABLE.app_not_installed,
  },
  timeout: { exitCode: DEVICE_EXIT_CODES.timeout, retryable: DEVICE_STATE_RETRYABLE.timeout },
  unknown: { exitCode: DEVICE_EXIT_CODES.generic, retryable: DEVICE_STATE_RETRYABLE.unknown },
  // Usage codes — retrying an identical invocation cannot help.
  unknown_flag: { exitCode: USAGE_EXIT_CODE, retryable: false },
  invalid_flag_value: { exitCode: USAGE_EXIT_CODE, retryable: false },
  missing_required_flag: { exitCode: USAGE_EXIT_CODE, retryable: false },
  unknown_command: { exitCode: USAGE_EXIT_CODE, retryable: false },
  invalid_transport: { exitCode: USAGE_EXIT_CODE, retryable: false },
  // Resolution codes.
  account_not_found: { exitCode: DEVICE_EXIT_CODES.generic, retryable: false },
  raw_descriptor_rejected: { exitCode: DEVICE_EXIT_CODES.generic, retryable: false },
  session_corrupt: { exitCode: DEVICE_EXIT_CODES.generic, retryable: false },
  // Same exit code as `disconnected`: both mean "no usable device right now, retry once
  // the user plugs in / unlocks", so scripts keying on `$?` need only one branch.
  device_not_found: { exitCode: DEVICE_EXIT_CODES.disconnected, retryable: true },
  // Several candidates: the fix is a more specific invocation (--device <id|name>).
  device_ambiguous: { exitCode: USAGE_EXIT_CODE, retryable: false },
  // BLE was requested but the optional '@abandonware/noble' dependency is not installed;
  // the fix is an environment change (install it or drop to USB), not a retry.
  ble_dependency_missing: { exitCode: USAGE_EXIT_CODE, retryable: false },
  swap_quotes_unavailable: { exitCode: DEVICE_EXIT_CODES.generic, retryable: false },
};

export type WalletCliErrorOptions = {
  /** Actionable next step, surfaced as `hint` in JSON envelopes and a dim trailer in human mode. */
  hint?: string;
  /** Machine-readable payload (e.g. `candidates` for device_ambiguous) surfaced as `details`. */
  details?: Record<string, unknown>;
  cause?: unknown;
};

export class WalletCliError extends Error {
  readonly code: WalletCliErrorCode;
  readonly exitCode: number;
  readonly retryable: boolean;
  readonly hint?: string;
  readonly details?: Record<string, unknown>;

  constructor(code: WalletCliErrorCode, message: string, options: WalletCliErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "WalletCliError";
    const defaults = WALLET_CLI_ERROR_DEFAULTS[code];
    this.code = code;
    this.exitCode = defaults.exitCode;
    this.retryable = defaults.retryable;
    this.hint = options.hint;
    this.details = options.details;
  }
}
