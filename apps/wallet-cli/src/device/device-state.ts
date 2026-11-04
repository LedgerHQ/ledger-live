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
 * "Likely", not "certain": wallet-cli only ever sees an errno from libusb.
 */
export type UsbLikelyCause =
  | "sandbox_blocking_usb"
  | "device_not_present"
  | "app_not_open"
  | "unknown";
export type RejectedContext = "sign" | "verify_address" | "open_app";

/**
 * `speculosUrl` is set when wallet-cli talks to Speculos instead of a USB device, and `detail`
 * carries why connecting to it failed.
 */
export type DeviceState =
  | {
      code: "disconnected";
      speculosUrl?: string;
      detail?: string;
      likelyCause?: UsbLikelyCause;
    }
  | { code: "wrong_app"; expected: string; found?: string }
  | { code: "awaiting_approval"; reason: AwaitingApprovalReason }
  | { code: "rejected"; context: RejectedContext; deviceModelId?: string }
  | { code: "exchange_app_needed" }
  | { code: "locked" }
  | { code: "app_not_installed"; appName: string }
  | { code: "timeout"; speculosUrl?: string; likelyCause?: UsbLikelyCause }
  | { code: "unknown"; cause: unknown; likelyCause?: UsbLikelyCause };

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

const USB_REFUSED_BY_SANDBOX_MESSAGE =
  "USB access to the Ledger was refused, likely by the agent sandbox.";

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
    case "disconnected": {
      const detail = state.detail ? ` (${state.detail})` : "";
      return {
        glyph: "[✖]",
        message: state.speculosUrl
          ? `Speculos not reachable at ${state.speculosUrl}${detail}. Start Speculos or fix SPECULOS_API_PORT / SPECULOS_ADDRESS, then retry.`
          : "Ledger not detected. Plug in, unlock, retry.",
        exitCode: DEVICE_EXIT_CODES.disconnected,
      };
    }
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
        message: state.speculosUrl
          ? `Timed out talking to Speculos at ${state.speculosUrl}. The emulated app may be waiting for a button press. Retry the command.`
          : renderUsbTimeoutMessage(state.likelyCause),
        exitCode: DEVICE_EXIT_CODES.timeout,
      };
    case "unknown":
      return {
        glyph: "[✖]",
        message:
          state.likelyCause === "sandbox_blocking_usb"
            ? USB_REFUSED_BY_SANDBOX_MESSAGE
            : unknownCauseMessage(state.cause),
        exitCode: DEVICE_EXIT_CODES.generic,
      };
  }
}

/**
 * The USB attribution a state carries, or `undefined` for states that carry none — which is what
 * `output.ts` gates the diagnostic fields on. A `timeout` defaults to `unknown`, and a
 * `disconnected` the classifier did not attribute defaults to `device_not_present`, which is what
 * "Ledger not detected" already tells the human. An `unknown` carries one only when the classifier
 * recognised a USB failure. A Speculos failure is not a USB one, so it carries none.
 */
export function usbLikelyCauseOf(state: DeviceState): UsbLikelyCause | undefined {
  if ("speculosUrl" in state && state.speculosUrl) return undefined;
  if (state.code === "timeout") return state.likelyCause ?? "unknown";
  if (state.code === "disconnected") return state.likelyCause ?? "device_not_present";
  if (state.code === "unknown") return state.likelyCause;
  return undefined;
}

function renderUsbTimeoutMessage(cause: UsbLikelyCause | undefined): string {
  switch (cause) {
    case "sandbox_blocking_usb":
      return USB_REFUSED_BY_SANDBOX_MESSAGE;
    case "device_not_present":
      return "No Ledger detected over USB. Plug in, unlock, retry.";
    case "app_not_open":
      return "Timed out waiting for the Ledger app to open.";
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
