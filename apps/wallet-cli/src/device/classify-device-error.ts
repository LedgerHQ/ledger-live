/**
 * Single classifier that maps any thrown value from the device stack (DMK,
 * @ledgerhq/hw-transport, rxjs) to a canonical `DeviceState`.
 *
 * Kept deliberately free of rendering / I/O — callers use `renderDeviceState` or wrap the
 * classified state in a `WalletCliDeviceError`.
 */

import { SendApduTimeoutError } from "@ledgerhq/device-management-kit";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { EmptyError } from "rxjs";
import { detectAgent } from "../shared/agent-detection";
import type { DeviceState, RejectedContext, UsbLikelyCause } from "./device-state";
import { speculosTarget } from "./speculos-target";
import { readUsbAccessDiagnostics } from "./usb-access-diagnostics";

export type ClassifyContext = {
  /** App name we attempted to open/use. Used for `app_not_installed` / `wrong_app`. */
  expectedApp?: string;
  /** Currently open app (if known) — used for `wrong_app.found`. */
  foundApp?: string;
  /** Defaults the rejection context when we can't infer it from the error itself. */
  rejectedContext?: RejectedContext;
  deviceModelId?: string;
};

const TRANSPORT_FRAMING_TAGS = new Set(["ReceiverApduError", "UnknownDeviceExchangeError"]);
/** DMK/wallet-cli errors that mean "could not reach the device over USB", cause unattributed. */
const USB_UNREACHABLE_NAMES = new Set([
  "DeviceDiscoveryFailedError",
  "DeviceConnectionFailedError",
]);
/**
 * Matched by `_tag`: DMK's connection errors extend `GeneralDmkError`, not `Error`, so they carry
 * no `name`. DMK's connection-opening tag (`ConnectionOpeningError`, which is what
 * `OpeningConnectionError` sets) is deliberately absent — `NodeWebUsbApduSender` reuses that class
 * for ordinary mid-session transfers, so it cannot tell "never got the device open" from "the link
 * broke mid-command". That case is named `DeviceConnectionFailedError` at its source instead.
 */
const USB_UNREACHABLE_TAGS = new Set(["NoAccessibleDeviceError"]);
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
  const eName = (error as { name?: string })?.name;
  return (
    error instanceof EmptyError ||
    eName === "DisconnectedDevice" ||
    eName === "DisconnectedDeviceDuringOperation"
  );
}

function isLockedError(error: unknown): boolean {
  const eName = (error as { name?: string })?.name;
  return (
    eName === "ManagerDeviceLocked" ||
    eName === "LockedDeviceError" ||
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
      return {
        code: "rejected",
        context: ctx.rejectedContext ?? "sign",
        ...(ctx.deviceModelId ? { deviceModelId: ctx.deviceModelId } : {}),
      };
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

/**
 * Attribute a USB failure, best effort.
 *
 * A Ledger the OS enumerated but refused to open means the host blocked us; it is blamed on a
 * sandbox only under an AI agent, since a missing udev rule or another process holding the device
 * gives the same refusal. If the latest scan saw no Ledger, nothing is plugged in.
 */
export function resolveUsbLikelyCause(ctx: ClassifyContext = {}): UsbLikelyCause {
  const { scanCompleted, ledgerVendorSeen, failure } = readUsbAccessDiagnostics();
  const kind = failure?.kind;

  if (kind === "access_denied" || kind === "device_unreachable") {
    return detectAgent().detected ? "sandbox_blocking_usb" : "unknown";
  }
  if (kind === "busy") return "unknown";
  if (scanCompleted && !ledgerVendorSeen) return "device_not_present";

  const awaitingAppOpen = ctx.expectedApp !== undefined && ctx.rejectedContext === "open_app";
  if (ledgerVendorSeen && kind === undefined && awaitingAppOpen) return "app_not_open";

  return "unknown";
}

/**
 * Exported for callers that build a timeout state without going through `classifyDeviceError`, such
 * as a command's own rxjs `--device-timeout`: hand-rolling `{ code: "timeout" }` loses the
 * attribution. On Speculos there is no USB to attribute: the state names the emulator instead.
 */
export function usbTimeoutState(ctx: ClassifyContext = {}): DeviceState {
  const speculos = speculosTarget();
  if (speculos.speculosUrl) return { code: "timeout", ...speculos };
  const likelyCause = resolveUsbLikelyCause(ctx);
  return likelyCause === "unknown" ? { code: "timeout" } : { code: "timeout", likelyCause };
}

function usbUnreachableState(error: unknown, ctx: ClassifyContext): DeviceState {
  if (speculosTarget().speculosUrl) return { code: "unknown", cause: error };
  const likelyCause = isInitialSessionBusyError(error) ? "unknown" : resolveUsbLikelyCause(ctx);
  return { code: "unknown", cause: error, likelyCause };
}

/**
 * An APDU timeout, or a garbled APDU. The latter is surfaced as a timeout since the root cause is
 * typically lock / busy and the fix is the same: retry.
 */
export function isUsbTimeoutError(error: unknown): boolean {
  return (
    error instanceof SendApduTimeoutError ||
    hasTag(error, "SendApduTimeoutError") ||
    hasAnyTag(error, TRANSPORT_FRAMING_TAGS)
  );
}

function isUsbUnreachableError(error: unknown): boolean {
  const name = (error as { name?: unknown })?.name;
  if (typeof name === "string" && USB_UNREACHABLE_NAMES.has(name)) return true;
  return hasAnyTag(error, USB_UNREACHABLE_TAGS);
}

function isInitialSessionBusyError(error: unknown): boolean {
  return (error as { name?: unknown })?.name === "InitialSessionBusyError";
}

export function classifyDeviceError(error: unknown, ctx: ClassifyContext = {}): DeviceState {
  if (error == null) return { code: "unknown", cause: error };

  if (isDisconnectedError(error)) {
    return { code: "disconnected", ...speculosTarget() };
  }

  if (isLockedError(error)) {
    return { code: "locked" };
  }

  if ((error as { name?: string })?.name === "TransportStatusError") {
    const state = classifyTransportStatusError(error as TransportStatusError, ctx);
    if (state) {
      return state;
    }
  }

  if (isUsbTimeoutError(error)) {
    return usbTimeoutState(ctx);
  }

  if (hasTag(error, "RefusedByUserDAError")) {
    return {
      code: "rejected",
      context: ctx.rejectedContext ?? "open_app",
      ...(ctx.deviceModelId ? { deviceModelId: ctx.deviceModelId } : {}),
    };
  }

  const errorCode = getErrorCode(error);
  if (errorCode !== undefined && APP_NOT_INSTALLED_OPEN_APP_CODES.has(errorCode)) {
    return {
      code: "app_not_installed",
      appName: ctx.expectedApp ?? "The required",
    };
  }

  if (isInitialSessionBusyError(error) || isUsbUnreachableError(error)) {
    return usbUnreachableState(error, ctx);
  }

  return { code: "unknown", cause: error };
}
