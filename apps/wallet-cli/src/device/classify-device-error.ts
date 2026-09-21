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
import type { DeviceState, RejectedContext, UsbTimeoutLikelyCause } from "./device-state";
import { classifyUsbAccessFailure, readUsbAccessDiagnostics } from "./usb-access-diagnostics";
import type { UsbAccessFailureKind } from "./usb-access-diagnostics";

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
 * A failure kind derived from the thrown error itself, for failures raised above the transport
 * (`DeviceDiscoveryFailedError`) where its wrapped throwable is the only evidence there is.
 */
function attributedFailureKind(error: unknown): UsbAccessFailureKind | undefined {
  if (error === undefined) return undefined;
  const kind = classifyUsbAccessFailure(error);
  const unattributable = kind === "other";
  return unattributable ? undefined : kind;
}

/**
 * `expectedApp` alone does not mean "waiting for the app to open": callers set it for a whole flow,
 * so it is still set long after the app opened. `rejectedContext` is what names the step, and
 * `sign` / `verify_address` are both past app-open (LIVE-31394).
 */
function couldBeAwaitingAppOpen(ctx: ClassifyContext): boolean {
  return ctx.rejectedContext === undefined || ctx.rejectedContext === "open_app";
}

/**
 * Attribute a USB failure, best effort.
 *
 * The discriminator that matters: if the OS enumerated a Ledger but we could not open it, the host
 * refused us — under an AI agent that is almost always its shell sandbox. If no Ledger was ever
 * enumerated, nothing is plugged in.
 */
export function resolveUsbTimeoutLikelyCause(
  ctx: ClassifyContext = {},
  error?: unknown,
): UsbTimeoutLikelyCause {
  const { scanCompleted, ledgerVendorSeen, failure } = readUsbAccessDiagnostics();
  // The transport saw the failure up close; the error's own chain is the fallback.
  const kind = failure?.kind ?? attributedFailureKind(error);

  if (kind === "access_denied") return "sandbox_blocking_usb";

  // "No such device" only means the host blocked us if we had already seen the device on the bus;
  // on its own it is indistinguishable from the device genuinely being absent.
  if (kind === "device_unreachable" && ledgerVendorSeen) return "sandbox_blocking_usb";

  // Never blame a sandbox for contention: "disable your sandbox" is worse advice than silence when
  // the real fix is to quit Ledger Live.
  if (kind === "busy") return "unknown";

  if (scanCompleted && !ledgerVendorSeen) return "device_not_present";

  if (
    ledgerVendorSeen &&
    kind === undefined &&
    ctx.expectedApp !== undefined &&
    couldBeAwaitingAppOpen(ctx)
  ) {
    return "app_not_open";
  }

  return "unknown";
}

/**
 * Exported for callers that build a timeout state without going through `classifyDeviceError`, such
 * as a command's own rxjs `--device-timeout`: hand-rolling `{ code: "timeout" }` loses the
 * attribution. `unknown` is the envelope's default, so the field is omitted rather than asserted.
 */
export function usbTimeoutState(ctx: ClassifyContext, error?: unknown): DeviceState {
  const likelyCause = resolveUsbTimeoutLikelyCause(ctx, error);
  return likelyCause === "unknown" ? { code: "timeout" } : { code: "timeout", likelyCause };
}

function isUsbUnreachableError(error: unknown): boolean {
  const name = (error as { name?: unknown })?.name;
  if (typeof name === "string" && USB_UNREACHABLE_NAMES.has(name)) return true;
  return hasAnyTag(error, USB_UNREACHABLE_TAGS);
}

export function classifyDeviceError(error: unknown, ctx: ClassifyContext = {}): DeviceState {
  if (error == null) return { code: "unknown", cause: error };

  if (isDisconnectedError(error)) {
    return { code: "disconnected" };
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

  if (error instanceof SendApduTimeoutError || hasTag(error, "SendApduTimeoutError")) {
    return usbTimeoutState(ctx, error);
  }

  // Garbled APDU. Surfaced as a timeout since the root cause is typically lock / busy and the fix
  // is the same: retry.
  if (hasAnyTag(error, TRANSPORT_FRAMING_TAGS)) {
    return usbTimeoutState(ctx, error);
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

  // Discovery gave up, or opening the connection failed. Both used to land on `unknown`
  // (LIVE-31394). `disconnected` keeps its own exit code (3) and message but still carries the
  // attribution, so the JSON envelope can publish `likely_cause` and `docs` for the commonest
  // failure of all — nothing plugged in.
  if (isUsbUnreachableError(error)) {
    const likelyCause = resolveUsbTimeoutLikelyCause(ctx, error);
    return likelyCause === "device_not_present"
      ? { code: "disconnected", likelyCause }
      : { code: "timeout", ...(likelyCause === "unknown" ? {} : { likelyCause }) };
  }

  return { code: "unknown", cause: error };
}
