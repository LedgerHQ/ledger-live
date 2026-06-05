import type { DeviceActionState, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import {
  ConnectAppDeviceAction,
  type ConnectAppDAError,
  type ConnectAppDAIntermediateValue,
  type ConnectAppDAOutput,
  type ConnectAppDARequiredInteraction,
} from "@ledgerhq/live-dmk-shared";
import { EmptyError, lastValueFrom } from "rxjs";
import { tap } from "rxjs/operators";
import { walletCliDebug } from "../shared/log";
import type { DeviceState } from "./device-state";
import { WalletCliDeviceError } from "./wallet-cli-device-error";

type ConnectAppState = DeviceActionState<
  ConnectAppDAOutput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue
>;

/**
 * Default unlock timeout: how long ConnectApp waits for the user to unlock the device
 * before giving up. Overridable per-call via the `deviceTimeoutMs` option (CLI flag
 * `--device-timeout`).
 */
export const DEFAULT_DEVICE_TIMEOUT_MS = 60_000;

/**
 * Silence timeout: abort the device action if it makes no progress at all (e.g. USB is
 * dead before any APDU comes back). Always >= deviceTimeoutMs + buffer.
 */
const SILENCE_TIMEOUT_EXTRA_MS = 60_000;

/**
 * When the device is locked inside an app (e.g. Ethereum), the DMK's `waitForDeviceUnlock`
 * polling may receive an unparseable APDU response (`ReceiverApduError`) instead of error
 * code 5515. The polling misidentifies this as "unlocked" and the action fails immediately.
 * We retry the whole device action so the user has time to unlock.
 */
const MAX_TRANSPORT_ERROR_RETRIES = 5;
const TRANSPORT_ERROR_RETRY_DELAY_MS = 3_000;

const RETRIABLE_TRANSPORT_TAGS = new Set(["ReceiverApduError", "UnknownDeviceExchangeError"]);

function summarizeConnectAppError(error: ConnectAppDAError): Record<string, unknown> {
  if (error instanceof Error) {
    return { kind: "Error", name: error.name, message: error.message };
  }
  if (typeof error === "object" && error !== null) {
    const o = error as unknown as Record<string, unknown>;
    const summary: Record<string, unknown> = {};
    if ("_tag" in o) summary._tag = o._tag;
    if ("errorCode" in o) summary.errorCode = o.errorCode;
    return summary;
  }
  return { value: String(error) };
}

function isTransportFramingError(error: ConnectAppDAError): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    RETRIABLE_TRANSPORT_TAGS.has((error as { _tag: string })._tag)
  );
}

export type ConnectLedgerAppOptions = {
  /** Observer invoked for each intermediate device-state transition (unlock, approve open). */
  onStateChange?: (state: DeviceState) => void;
  /** Max time to wait for the device to be unlocked. Defaults to DEFAULT_DEVICE_TIMEOUT_MS. */
  deviceTimeoutMs?: number;
};

/**
 * Open the Ledger Manager app by name on an existing DMK USB session (same device action
 * as Live LDk connectApp). Emits intermediate `DeviceState`s via `options.onStateChange`
 * and throws `WalletCliDeviceError` for every failure path.
 */
export async function connectLedgerApp(
  dmk: DeviceManagementKit,
  sessionId: string,
  managerAppName: string,
  options: ConnectLedgerAppOptions = {},
): Promise<void> {
  const deviceTimeoutMs = options.deviceTimeoutMs ?? DEFAULT_DEVICE_TIMEOUT_MS;
  const silenceTimeoutMs = deviceTimeoutMs + SILENCE_TIMEOUT_EXTRA_MS;

  for (let attempt = 0; ; attempt++) {
    const result = await connectLedgerAppOnce(dmk, sessionId, managerAppName, {
      onStateChange: options.onStateChange,
      deviceTimeoutMs,
      silenceTimeoutMs,
    });
    if (!result) return;

    if (isTransportFramingError(result) && attempt < MAX_TRANSPORT_ERROR_RETRIES) {
      walletCliDebug(
        "Transport framing error, retrying ConnectApp (%d/%d)…",
        attempt + 1,
        MAX_TRANSPORT_ERROR_RETRIES,
      );
      await new Promise(r => globalThis.setTimeout(r, TRANSPORT_ERROR_RETRY_DELAY_MS));
      continue;
    }

    throw WalletCliDeviceError.fromUnknown(result, { expectedApp: managerAppName });
  }
}

/**
 * Single attempt at running ConnectAppDeviceAction.
 * Returns `undefined` on success, or the DA error to let the caller decide whether to retry.
 */
async function connectLedgerAppOnce(
  dmk: DeviceManagementKit,
  sessionId: string,
  managerAppName: string,
  {
    onStateChange,
    deviceTimeoutMs,
    silenceTimeoutMs,
  }: {
    onStateChange?: (state: DeviceState) => void;
    deviceTimeoutMs: number;
    silenceTimeoutMs: number;
  },
): Promise<ConnectAppDAError | undefined> {
  const deviceAction = new ConnectAppDeviceAction({
    input: {
      application: { name: managerAppName },
      dependencies: [],
      requireLatestFirmware: false,
      allowMissingApplication: false,
      unlockTimeout: deviceTimeoutMs,
    },
  });

  let finalState: ConnectAppState;
  const { observable, cancel } = dmk.executeDeviceAction({ sessionId, deviceAction });
  const silenceTimeoutError = { _tag: "SendApduTimeoutError" } as ConnectAppDAError;
  let stallTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  const silenceTimeoutPromise = new Promise<never>((_, reject) => {
    stallTimer = globalThis.setTimeout(() => {
      try {
        cancel();
      } catch (e) {
        walletCliDebug("ConnectApp cancel after silence timeout failed: %o", e);
      }
      reject(silenceTimeoutError);
    }, silenceTimeoutMs);
  });

  let lastRequiredInteraction: ConnectAppDARequiredInteraction | undefined;
  const onIntermediateState = (state: ConnectAppState) => {
    if (state.status !== DeviceActionStatus.Pending) return;
    const r = state.intermediateValue?.requiredUserInteraction;
    if (r == null || r === UserInteractionRequired.None || r === lastRequiredInteraction) {
      return;
    }
    lastRequiredInteraction = r;
    walletCliDebug("ConnectApp pending: requiredUserInteraction=%s app=%s", r, managerAppName);

    if (r === UserInteractionRequired.UnlockDevice) {
      onStateChange?.({ code: "awaiting_approval", reason: "unlock" });
    } else if (r === UserInteractionRequired.ConfirmOpenApp) {
      onStateChange?.({ code: "awaiting_approval", reason: "open_app" });
    }
  };
  try {
    finalState = await Promise.race([
      lastValueFrom(observable.pipe(tap(onIntermediateState))),
      silenceTimeoutPromise,
    ]);
  } catch (e) {
    if (e instanceof EmptyError) {
      throw new WalletCliDeviceError({ code: "disconnected" }, { cause: e });
    }
    throw WalletCliDeviceError.fromUnknown(e, { expectedApp: managerAppName });
  } finally {
    if (stallTimer !== undefined) {
      globalThis.clearTimeout(stallTimer);
    }
  }

  walletCliDebug("ConnectApp finalState: status=%s app=%s", finalState.status, managerAppName);

  if (finalState.status === DeviceActionStatus.Error) {
    walletCliDebug("ConnectApp error detail: %o", summarizeConnectAppError(finalState.error));
    return finalState.error;
  }

  if (finalState.status === DeviceActionStatus.Completed && finalState.output) {
    const out = finalState.output;
    walletCliDebug(
      "ConnectApp completed: derivation=%s hasInstallResult=%s",
      out.derivation ?? "(none)",
      out.installResult != null,
    );
  }
  if (finalState.status !== DeviceActionStatus.Completed) {
    throw new WalletCliDeviceError({
      code: "unknown",
      cause: new Error(`Connect app ended with status: ${finalState.status}`),
    });
  }
  return undefined;
}
