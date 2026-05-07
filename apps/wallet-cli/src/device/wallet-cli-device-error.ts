/**
 * Strongly-typed wallet-cli error carrying a classified `DeviceState` + process exit code.
 *
 * All device-requiring commands throw (or re-throw) this class so the output layer
 * (`output.ts`) can render the canonical glyph + message and exit with the taxonomy
 * code declared in `device-state.ts`.
 */

import { classifyDeviceError, type ClassifyContext } from "./classify-device-error";
import { type DeviceState, type DeviceExitCode, renderDeviceState } from "./device-state";

export class WalletCliDeviceError extends Error {
  readonly state: DeviceState;
  readonly exitCode: DeviceExitCode;

  constructor(state: DeviceState, options?: { cause?: unknown }) {
    const { message, exitCode } = renderDeviceState(state);
    super(message, options);
    this.name = "WalletCliDeviceError";
    this.state = state;
    this.exitCode = exitCode;
  }

  static fromUnknown(error: unknown, ctx?: ClassifyContext): WalletCliDeviceError {
    if (error instanceof WalletCliDeviceError) return error;
    const state = classifyDeviceError(error, ctx);
    return new WalletCliDeviceError(state, { cause: error });
  }

  static fromKnownDeviceError(
    error: unknown,
    ctx?: ClassifyContext,
  ): WalletCliDeviceError | undefined {
    if (error instanceof WalletCliDeviceError) return error;
    const state = classifyDeviceError(error, ctx);
    if (state.code === "unknown") return undefined;
    return new WalletCliDeviceError(state, { cause: error });
  }
}

/**
 * Convenience wrapper used on error boundaries: ensures any thrown value becomes a
 * `WalletCliDeviceError`, preserving the original as `cause`.
 */
export function toWalletCliDeviceError(
  error: unknown,
  ctx?: ClassifyContext,
): WalletCliDeviceError {
  return WalletCliDeviceError.fromUnknown(error, ctx);
}
