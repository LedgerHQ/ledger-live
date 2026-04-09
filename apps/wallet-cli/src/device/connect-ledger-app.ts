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
  const tag = "_tag" in error ? error._tag : "UnknownError";
  const code = "errorCode" in error ? ` (${error.errorCode})` : "";
  return new Error(`${tag}${code}`);
}

/**
 * Open the Ledger Manager app by name on an existing DMK USB session (same device action as Live LDk connectApp).
 */
export async function connectLedgerApp(
  dmk: DeviceManagementKit,
  sessionId: string,
  managerAppName: string,
): Promise<void> {
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
          } else if (key === UserInteractionRequired.SignTransaction) {
            process.stderr.write(
              `[~] Action Required: Review the transaction on your Ledger screen and confirm or reject on device.\n`,
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
    throw toError(finalState.error);
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
}
