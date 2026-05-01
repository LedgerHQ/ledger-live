/**
 * Single classifier that maps any thrown value from the device stack (DMK, @ledgerhq/errors,
 * @ledgerhq/hw-transport, rxjs) to a canonical `DeviceState`.
 *
 * Kept deliberately free of rendering / I/O — callers use `renderDeviceState` or wrap the
 * classified state in a `WalletCliDeviceError`.
 */

import { SendApduTimeoutError } from "@ledgerhq/device-management-kit";
import {
  DisconnectedDevice,
  DisconnectedDeviceDuringOperation,
  LockedDeviceError,
  ManagerDeviceLockedError,
} from "@ledgerhq/errors";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { EmptyError } from "rxjs";
import type { DeviceState, RejectedContext } from "./device-state";

export type ClassifyContext = {
  /** App name we attempted to open/use. Used for `app_not_installed` / `wrong_app`. */
  expectedApp?: string;
  /** Currently open app (if known) — used for `wrong_app.found`. */
  foundApp?: string;
  /** Defaults the rejection context when we can't infer it from the error itself. */
  rejectedContext?: RejectedContext;
};

const TRANSPORT_FRAMING_TAGS = new Set(["ReceiverApduError", "UnknownDeviceExchangeError"]);
const APP_NOT_INSTALLED_OPEN_APP_CODES = new Set(["670a", "6807"]);

function hasTag(error: unknown, tag: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    (error as { _tag: unknown })._tag === tag
  );
}

function hasAnyTag(error: unknown, tags: ReadonlySet<string>): boolean {
  if (typeof error !== "object" || error === null || !("_tag" in error)) return false;
  const tag = (error as { _tag: unknown })._tag;
  return typeof tag === "string" && tags.has(tag);
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "errorCode" in error) {
    const code = (error as { errorCode: unknown }).errorCode;
    if (typeof code === "string") return code.toLowerCase();
  }
  return undefined;
}

function isDisconnectedError(error: unknown): boolean {
  return (
    error instanceof EmptyError ||
    error instanceof DisconnectedDevice ||
    error instanceof DisconnectedDeviceDuringOperation
  );
}

function isLockedError(error: unknown): boolean {
  return (
    error instanceof ManagerDeviceLockedError ||
    error instanceof LockedDeviceError ||
    hasTag(error, "DeviceLockedError")
  );
}

function classifyTransportStatusError(
  error: TransportStatusError,
  ctx: ClassifyContext,
): DeviceState | undefined {
  switch (error.statusCode) {
    case StatusCodes.LOCKED_DEVICE:
    case StatusCodes.SECURITY_STATUS_NOT_SATISFIED:
      return { code: "locked" };
    case StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED:
      return { code: "rejected", context: ctx.rejectedContext ?? "sign" };
    case StatusCodes.CLA_NOT_SUPPORTED:
    case StatusCodes.INS_NOT_SUPPORTED:
      return {
        code: "wrong_app",
        expected: ctx.expectedApp ?? "the correct app",
        found: ctx.foundApp,
      };
    default:
      return undefined;
  }
}

export function classifyDeviceError(error: unknown, ctx: ClassifyContext = {}): DeviceState {
  // Device-not-detected: rxjs EmptyError is thrown when lastValueFrom sees no emission,
  // @ledgerhq/errors Disconnected* covers USB unplug / transport close.
  if (isDisconnectedError(error)) {
    return { code: "disconnected" };
  }

  // Device locked (multiple representations across stacks).
  if (isLockedError(error)) {
    return { code: "locked" };
  }

  // User-rejection / wrong-app / locked via legacy SW codes.
  if (error instanceof TransportStatusError) {
    const state = classifyTransportStatusError(error, ctx);
    if (state) {
      return state;
    }
  }

  // Timeouts talking to the device — surface as a retriable timeout.
  if (error instanceof SendApduTimeoutError || hasTag(error, "SendApduTimeoutError")) {
    return { code: "timeout" };
  }

  // Transport framing errors (garbled APDU). Surfaced as timeout since root cause is
  // typically lock / busy and the fix is the same: retry.
  if (hasAnyTag(error, TRANSPORT_FRAMING_TAGS)) {
    return { code: "timeout" };
  }

  // DMK refused-by-user (RefusedByUserDAError) happens when the user declines the OpenApp prompt.
  if (hasTag(error, "RefusedByUserDAError")) {
    return { code: "rejected", context: ctx.rejectedContext ?? "open_app" };
  }

  // OpenApp command error codes: 670a (app not found) / 6807 (app not installed).
  const errorCode = getErrorCode(error);
  if (errorCode !== undefined && APP_NOT_INSTALLED_OPEN_APP_CODES.has(errorCode)) {
    return {
      code: "app_not_installed",
      appName: ctx.expectedApp ?? "The required",
    };
  }

  return { code: "unknown", cause: error };
}
