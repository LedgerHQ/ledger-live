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
export type RejectedContext = "sign" | "verify_address" | "open_app";

export type DeviceState =
  | { code: "disconnected" }
  | { code: "wrong_app"; expected: string; found?: string }
  | { code: "awaiting_approval"; reason: AwaitingApprovalReason }
  | { code: "rejected"; context: RejectedContext }
  | { code: "exchange_app_needed" }
  | { code: "locked" }
  | { code: "app_not_installed"; appName: string }
  | { code: "timeout" }
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
        message:
          "Timed out talking to the Ledger over USB. The device may be busy or locked. Retry the command.",
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
