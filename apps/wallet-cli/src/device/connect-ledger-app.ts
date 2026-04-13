import type { DeviceActionState, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import {
  ConnectAppDeviceAction,
  type ConnectAppDAError,
  type ConnectAppDAIntermediateValue,
  type ConnectAppDAOutput,
} from "@ledgerhq/live-dmk-shared";
import { EmptyError, lastValueFrom } from "rxjs";
import { tap } from "rxjs/operators";
import { walletCliDebug } from "../shared/log";
import { toWalletCliDeviceError } from "./wallet-cli-device-error";

type ConnectAppState = DeviceActionState<
  ConnectAppDAOutput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue
>;

/**
 * Unlike Live's connectApp (unlockTimeout: 0), the CLI uses a positive timeout so users can
 * unlock the device after starting a command.
 */
const CONNECT_APP_UNLOCK_TIMEOUT_MS = 60_000;

/**
 * Abort ConnectApp if it makes no progress. RxJS `timeout()` alone is insufficient when DMK/USB work
 * blocks without scheduling timers; we call `executeDeviceAction().cancel()` on a wall-clock timer (same
 * pattern as Live unsubscribing from the device action).
 */
const CONNECT_APP_SILENCE_TIMEOUT_MS = CONNECT_APP_UNLOCK_TIMEOUT_MS + 60_000;

/**
 * When the device is locked inside an app (e.g. Ethereum), the DMK's `waitForDeviceUnlock` polling
 * may receive an unparseable APDU response (`ReceiverApduError`) instead of error code 5515.
 * The polling misidentifies this as "unlocked" and the action fails immediately.
 * We retry the whole device action so the user has time to unlock.
 */
const MAX_TRANSPORT_ERROR_RETRIES = 5;
const TRANSPORT_ERROR_RETRY_DELAY_MS = 3_000;

function summarizeConnectAppError(error: ConnectAppDAError): Record<string, unknown> {
  if (error instanceof Error) {
    return { kind: "Error", name: error.name, message: error.message };
  }
  if (typeof error === "object" && error !== null) {
    const o = error as unknown as Record<string, unknown>;
    const summary: Record<string, unknown> = {};
    if ("_tag" in o) {
      summary._tag = o._tag;
    }
    if ("errorCode" in o) {
      summary.errorCode = o.errorCode;
    }
    return summary;
  }
  return { value: String(error) };
}

function toError(error: ConnectAppDAError): Error {
  if (error instanceof Error) {
    return toWalletCliDeviceError(error);
  }
  if ("_tag" in error && error._tag === "SendApduTimeoutError") {
    return toWalletCliDeviceError(error);
  }
  if (isTransportFramingError(error)) {
    return toWalletCliDeviceError(error);
  }
  const tag = "_tag" in error ? error._tag : "UnknownError";
  const code = "errorCode" in error ? ` (${error.errorCode})` : "";
  return new Error(`${tag}${code}`);
}

const RETRIABLE_TRANSPORT_TAGS = new Set(["ReceiverApduError", "UnknownDeviceExchangeError"]);

function isTransportFramingError(error: ConnectAppDAError): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    RETRIABLE_TRANSPORT_TAGS.has((error as { _tag: string })._tag)
  );
}

/**
 * Open the Ledger Manager app by name on an existing DMK USB session (same device action as Live LDk connectApp).
 */
export async function connectLedgerApp(
  dmk: DeviceManagementKit,
  sessionId: string,
  managerAppName: string,
): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    const result = await connectLedgerAppOnce(dmk, sessionId, managerAppName);
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

    throw toError(result);
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
): Promise<ConnectAppDAError | undefined> {
  const deviceAction = new ConnectAppDeviceAction({
    input: {
      application: { name: managerAppName },
      dependencies: [],
      requireLatestFirmware: false,
      allowMissingApplication: false,
      unlockTimeout: CONNECT_APP_UNLOCK_TIMEOUT_MS,
    },
  });

  let finalState: ConnectAppState;
  const { observable, cancel } = dmk.executeDeviceAction({ sessionId, deviceAction });
  const stallTimer = globalThis.setTimeout(() => {
    cancel();
  }, CONNECT_APP_SILENCE_TIMEOUT_MS);

  let lastRequiredInteraction: string | undefined;
  try {
    finalState = await lastValueFrom(
      observable.pipe(
        tap((state: ConnectAppState) => {
          if (state.status !== DeviceActionStatus.Pending) {
            return;
          }
          const r = state.intermediateValue?.requiredUserInteraction;
          if (r == null || r === UserInteractionRequired.None) {
            return;
          }
          const key = String(r);
          if (key === lastRequiredInteraction) {
            return;
          }
          lastRequiredInteraction = key;
          walletCliDebug(
            "ConnectApp pending: requiredUserInteraction=%s app=%s",
            key,
            managerAppName,
          );

          // Write user-visible messages to stderr
          if (r === UserInteractionRequired.UnlockDevice) {
            process.stderr.write(
              `[~] Waiting: Ledger detected but locked. Enter your PIN on the device.\n`,
            );
          } else if (r === UserInteractionRequired.ConfirmOpenApp) {
            process.stderr.write(
              `[i] Opening ${managerAppName} app on your Ledger... ACTION REQUIRED: Confirm on device screen.\n`,
            );
          }
        }),
      ),
    );
  } catch (e) {
    if (e instanceof EmptyError) {
      throw new Error(
        `[x] Error: Ledger device not detected. Plug in your Ledger via USB, enter your PIN, then run the command again.`,
        { cause: e },
      );
    }
    throw toWalletCliDeviceError(e);
  } finally {
    globalThis.clearTimeout(stallTimer);
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
    throw new Error(`Connect app ended with status: ${finalState.status}`);
  }
  return undefined;
}
