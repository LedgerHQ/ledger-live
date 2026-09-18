/**
 * Shared device-state union used by every device-requiring command (sync, receive, send,
 * future swap execute). A single source of truth for:
 *
 *  - the canonical glyph + actionable message shown to the user,
 *  - the exit code reported by the process,
 *  - the `code` field included in JSON error envelopes for programmatic consumers.
 *
 * Terminal states (disconnected, wrong_app, rejected, locked, app_not_installed, timeout,
 * unknown) are attached to `WalletCliDeviceError` and cause a non-zero exit.
 * Non-terminal states (awaiting_approval, exchange_app_needed) are emitted via
 * `CommandOutput.deviceState` as the user makes progress.
 */

export type DeviceStateCode =
  | "disconnected"
  | "wrong_app"
  | "awaiting_approval"
  | "rejected"
  | "exchange_app_needed"
  | "locked"
  | "app_not_installed"
  | "timeout"
  | "unknown";

export type AwaitingApprovalReason = "sign" | "verify_address" | "open_app" | "unlock";

/**
 * Best-effort attribution for a USB failure, reported as `likely_cause` in JSON error envelopes.
 *
 * "Likely", not "certain": wallet-cli only ever sees an errno from libusb. `sandbox_blocking_usb`
 * in particular is an inference from "the OS refused a device it had already enumerated" — see
 * `usb-access-diagnostics.ts`.
 *
 * `usb_session_stale` is declared but **never produced yet**: detecting it needs the auto-lock
 * session handling from LIVE-31395. It is not advertised in the agent skill until it can occur.
 */
export type UsbTimeoutLikelyCause =
  | "sandbox_blocking_usb"
  | "usb_session_stale"
  | "device_not_present"
  | "app_not_open"
  | "unknown";
export type RejectedContext = "sign" | "verify_address" | "open_app";

export type DeviceState =
  | { code: "disconnected"; likelyCause?: UsbTimeoutLikelyCause }
  | { code: "wrong_app"; expected: string; found?: string }
  | { code: "awaiting_approval"; reason: AwaitingApprovalReason }
  | { code: "rejected"; context: RejectedContext; deviceModelId?: string }
  | { code: "exchange_app_needed" }
  | { code: "locked" }
  | { code: "app_not_installed"; appName: string }
  | { code: "timeout"; likelyCause?: UsbTimeoutLikelyCause }
  | { code: "unknown"; cause: unknown };

export type DeviceStateGlyph = "[✖]" | "[⧖]" | "[ℹ]";

export const DEVICE_EXIT_CODES = {
  success: 0,
  generic: 1,
  rejected: 2,
  disconnected: 3,
  wrong_app: 4,
  app_not_installed: 5,
  timeout: 6,
} as const;

export type DeviceExitCode = (typeof DEVICE_EXIT_CODES)[keyof typeof DEVICE_EXIT_CODES];

/** Every `error.code` wallet-cli publishes. Diverges from `DeviceStateCode` only for `timeout`. */
export type DeviceStateWireCode = Exclude<DeviceStateCode, "timeout"> | "USB_TIMEOUT";

/**
 * `error.code` as published in JSON error envelopes, per internal state code.
 *
 * One table rather than a special case inlined in `output.ts`, so the single place where the wire
 * name diverges from the internal name is auditable. `timeout` is published as `USB_TIMEOUT`
 * (LIVE-31394) because agents match on a stable identifier; NDJSON `device-state` progress events
 * keep emitting the internal `"timeout"`, so both spellings are documented in the agent skill.
 *
 * Typed as a union rather than `string` so a typo in a published code is a compile error.
 */
export const DEVICE_STATE_WIRE_CODES: Record<DeviceStateCode, DeviceStateWireCode> = {
  disconnected: "disconnected",
  wrong_app: "wrong_app",
  awaiting_approval: "awaiting_approval",
  rejected: "rejected",
  exchange_app_needed: "exchange_app_needed",
  locked: "locked",
  app_not_installed: "app_not_installed",
  timeout: "USB_TIMEOUT",
  unknown: "unknown",
};

/**
 * A terminal state causes the process to exit non-zero once rendered.
 * Intermediate states only drive user-facing progress messages.
 */
export function isTerminalDeviceState(state: DeviceState): boolean {
  switch (state.code) {
    case "awaiting_approval":
    case "exchange_app_needed":
      return false;
    default:
      return true;
  }
}

/**
 * Pure mapping from a DeviceState to the glyph + actionable message + process exit code.
 * Shared by the human renderer (spinner text) and the JSON error envelope (code + message).
 */
export function renderDeviceState(state: DeviceState): {
  glyph: DeviceStateGlyph;
  message: string;
  exitCode: DeviceExitCode;
} {
  switch (state.code) {
    case "disconnected":
      return {
        glyph: "[✖]",
        message: "Ledger not detected. Plug in, unlock, retry.",
        exitCode: DEVICE_EXIT_CODES.disconnected,
      };
    case "wrong_app": {
      const found = state.found ? ` (found: ${state.found})` : "";
      return {
        glyph: "[✖]",
        message: `Wrong app${found}. Open ${state.expected}.`,
        exitCode: DEVICE_EXIT_CODES.wrong_app,
      };
    }
    case "awaiting_approval":
      return {
        glyph: "[⧖]",
        message: renderAwaitingApprovalMessage(state.reason),
        exitCode: DEVICE_EXIT_CODES.success,
      };
    case "rejected":
      return {
        glyph: "[✖]",
        message: renderRejectedMessage(state.context),
        exitCode: DEVICE_EXIT_CODES.rejected,
      };
    case "exchange_app_needed":
      return {
        glyph: "[ℹ]",
        message: "Open Exchange app.",
        exitCode: DEVICE_EXIT_CODES.success,
      };
    case "locked":
      return {
        glyph: "[✖]",
        message: "Ledger is locked. Unlock your device with your PIN and retry.",
        exitCode: DEVICE_EXIT_CODES.timeout,
      };
    case "app_not_installed":
      return {
        glyph: "[✖]",
        message: `${state.appName} app is not installed. Install it via Ledger Live and retry.`,
        exitCode: DEVICE_EXIT_CODES.app_not_installed,
      };
    case "timeout":
      return {
        glyph: "[✖]",
        message: renderUsbTimeoutMessage(state.likelyCause),
        exitCode: DEVICE_EXIT_CODES.timeout,
      };
    case "unknown":
      return {
        glyph: "[✖]",
        message: unknownCauseMessage(state.cause),
        exitCode: DEVICE_EXIT_CODES.generic,
      };
  }
}

/**
 * The USB attribution a state carries, or `undefined` for states that carry none.
 *
 * Single source of truth for "is this a USB failure we can diagnose", used by `output.ts` to decide
 * whether to publish `likely_cause` / `agent_hint` / `user_hint` / `docs`. A `timeout` always
 * qualifies and defaults to `unknown`; a `disconnected` qualifies only when the classifier
 * attributed it, so ordinary mid-operation disconnects are not dressed up as diagnoses.
 */
export function usbLikelyCauseOf(state: DeviceState): UsbTimeoutLikelyCause | undefined {
  if (state.code === "timeout") return state.likelyCause ?? "unknown";
  if (state.code === "disconnected") return state.likelyCause;
  return undefined;
}

function renderUsbTimeoutMessage(cause: UsbTimeoutLikelyCause | undefined): string {
  switch (cause) {
    // Wording from LIVE-31394; the detail lives in `likely_cause` and the hints, not the message.
    case "sandbox_blocking_usb":
      return "Timed out talking to the Ledger over USB.";
    case "device_not_present":
      return "No Ledger detected over USB. Plug in, unlock, retry.";
    case "app_not_open":
      return "Timed out waiting for the Ledger app to open.";
    case "usb_session_stale":
      return "The USB session went stale (the device locked). Unplug and replug, then retry.";
    default:
      return "Timed out talking to the Ledger over USB. The device may be busy or locked. Retry the command.";
  }
}

function renderAwaitingApprovalMessage(reason: AwaitingApprovalReason): string {
  switch (reason) {
    case "sign":
      return "Review on device. Approve or reject.";
    case "verify_address":
      return "Review address on device. Approve or reject.";
    case "open_app":
      return "Confirm on device to open the app.";
    case "unlock":
      return "Ledger is locked. Enter your PIN on the device.";
  }
}

function renderRejectedMessage(context: RejectedContext): string {
  switch (context) {
    case "sign":
      return "Rejected on device. No action taken.";
    case "verify_address":
      return "Rejected on device. Address not confirmed.";
    case "open_app":
      return "Rejected on device. App was not opened.";
  }
}

function unknownCauseMessage(cause: unknown): string {
  if (cause instanceof Error && cause.message) return cause.message;
  if (typeof cause === "string" && cause.length > 0) return cause;
  return "An unknown error occurred talking to the Ledger.";
}
