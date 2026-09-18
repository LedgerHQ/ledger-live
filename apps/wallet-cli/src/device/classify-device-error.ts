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
 * Matched by `_tag`, because DMK's connection errors extend `GeneralDmkError` (which implements
 * `DmkError`) rather than `Error` — they carry no `name` at all.
 *
 * `OpeningConnectionError` is deliberately absent despite naming the case we want.
 * `NodeWebUsbApduSender` reuses it for ordinary mid-session transfers ("Device not connected", a
 * bad `transferIn`/`transferOut` status), so matching it here would drag a broken APDU exchange
 * into USB attribution and report it as a timeout with a host-side cause. The initial failure is
 * wrapped as `DeviceConnectionFailedError` at its source instead, which is unambiguous.
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
 * A failure kind derived from the thrown error itself, for failures the transport never recorded.
 *
 * The transport records what it sees during a scan, but a discovery error raised above it
 * (`DeviceDiscoveryFailedError`) carries the original throwable as `cause` and is the only evidence
 * there is. `other` is reported as "no attribution" rather than as a failure, so it cannot suppress
 * the `app_not_open` inference below.
 */
function attributedFailureKind(error: unknown): UsbAccessFailureKind | undefined {
  if (error === undefined) return undefined;
  const kind = classifyUsbAccessFailure(error);
  return kind === "other" ? undefined : kind;
}

/**
 * True while the app-open step is still plausibly what we are waiting on.
 *
 * `expectedApp` alone does not mean "waiting for the app to open": callers set it for a whole flow
 * (`sign-and-broadcast.ts` for the entire send, `receive.ts` for the address check), so it is still
 * set long after the app opened. `rejectedContext` is what actually names the step — `sign` and
 * `verify_address` are both past app-open, so attributing their timeouts to `app_not_open` would
 * tell the user to open an app that is already open (LIVE-31394).
 */
function couldBeAwaitingAppOpen(ctx: ClassifyContext): boolean {
  return ctx.rejectedContext === undefined || ctx.rejectedContext === "open_app";
}

/**
 * Attribute a USB failure, best effort.
 *
 * The discriminator that matters: if the OS enumerated a Ledger but we could not open it, the host
 * refused us — under an AI agent that is almost always its shell sandbox. If no Ledger was ever
 * enumerated, nothing is plugged in. A `busy` failure is deliberately left `unknown` rather than
 * blamed on a sandbox: telling an agent to disable its sandbox when the real fix is "quit Ledger
 * Live" is worse than saying nothing.
 */
export function resolveUsbTimeoutLikelyCause(
  ctx: ClassifyContext = {},
  error?: unknown,
): UsbTimeoutLikelyCause {
  const { scanCompleted, ledgerVendorSeen, failure } = readUsbAccessDiagnostics();
  // Module state first — the transport saw the failure up close. The error's own cause chain is the
  // fallback for failures raised above the transport.
  const kind = failure?.kind ?? attributedFailureKind(error);

  // The OS said "no" outright. Unambiguous: something on the host is refusing us, whether or not
  // we ever managed to enumerate the device.
  if (kind === "access_denied") return "sandbox_blocking_usb";

  // "No such device" only means the host blocked us if we had already seen the device on the bus;
  // on its own it is indistinguishable from the device genuinely being absent.
  if (kind === "device_unreachable" && ledgerVendorSeen) return "sandbox_blocking_usb";

  // Contention is its own thing. Never blame a sandbox for it — "disable your sandbox" is worse
  // advice than silence when the real fix is to quit Ledger Live.
  if (kind === "busy") return "unknown";

  if (scanCompleted && !ledgerVendorSeen) return "device_not_present";

  // We reached the device and it answered; the wait was for it to get into the app we asked for.
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
 * A timeout state carrying an attribution, with the field omitted when we have nothing to say.
 * `unknown` is the envelope's default (see `output.ts`), so leaving it out keeps the state minimal
 * rather than asserting ignorance.
 *
 * Exported for callers that build a timeout state without going through `classifyDeviceError`,
 * such as a command's own rxjs `--device-timeout`: they must not hand-roll `{ code: "timeout" }`
 * or the failure loses its attribution.
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
  // Null/undefined can't be classified by name; fall through to unknown.
  if (error == null) return { code: "unknown", cause: error };

  // Device-not-detected: rxjs EmptyError is thrown when lastValueFrom sees no emission,
  // Disconnected* covers USB unplug / transport close.
  if (isDisconnectedError(error)) {
    return { code: "disconnected" };
  }

  // Device locked (multiple representations across stacks).
  if (isLockedError(error)) {
    return { code: "locked" };
  }

  // User-rejection / wrong-app / locked via legacy SW codes.
  if ((error as { name?: string })?.name === "TransportStatusError") {
    const state = classifyTransportStatusError(error as TransportStatusError, ctx);
    if (state) {
      return state;
    }
  }

  // Timeouts talking to the device — surface as a retriable timeout.
  if (error instanceof SendApduTimeoutError || hasTag(error, "SendApduTimeoutError")) {
    return usbTimeoutState(ctx, error);
  }

  // Transport framing errors (garbled APDU). Surfaced as timeout since root cause is
  // typically lock / busy and the fix is the same: retry.
  if (hasAnyTag(error, TRANSPORT_FRAMING_TAGS)) {
    return usbTimeoutState(ctx, error);
  }

  // DMK refused-by-user (RefusedByUserDAError) happens when the user declines the OpenApp prompt.
  if (hasTag(error, "RefusedByUserDAError")) {
    return {
      code: "rejected",
      context: ctx.rejectedContext ?? "open_app",
      ...(ctx.deviceModelId ? { deviceModelId: ctx.deviceModelId } : {}),
    };
  }

  // OpenApp command error codes: 670a (app not found) / 6807 (app not installed).
  const errorCode = getErrorCode(error);
  if (errorCode !== undefined && APP_NOT_INSTALLED_OPEN_APP_CODES.has(errorCode)) {
    return {
      code: "app_not_installed",
      appName: ctx.expectedApp ?? "The required",
    };
  }

  // Could not reach the device at all: discovery gave up, or opening the connection failed. Both
  // used to land on `unknown` with a message naming the device, which is what LIVE-31394 reports.
  if (isUsbUnreachableError(error)) {
    const likelyCause = resolveUsbTimeoutLikelyCause(ctx, error);
    // `disconnected` keeps its own exit code (3) and its own message, but still carries the
    // attribution so the JSON envelope can publish `likely_cause` and `docs` for the commonest
    // failure of all — nothing plugged in.
    return likelyCause === "device_not_present"
      ? { code: "disconnected", likelyCause }
      : { code: "timeout", ...(likelyCause === "unknown" ? {} : { likelyCause }) };
  }

  return { code: "unknown", cause: error };
}
