import { connectLedgerApp } from "../device/connect-ledger-app";
import { toWalletCliDeviceError, WalletCliDeviceError } from "../device/wallet-cli-device-error";
import {
  ensureWalletCliDmkTransport,
  getWalletCliDeviceModelId,
  resetWalletCliDmkSession,
} from "../device/register-dmk-transport";
import { withWalletCliDeviceInterruptScope } from "../device/interrupt-scope";
import { walletCliDebug } from "../shared/log";
import {
  deviceFlowFailureReason,
  trackAppOpened,
  trackAppRequested,
  trackDeviceConnected,
  trackDeviceFlowCompleted,
  trackDeviceFlowFailed,
  trackDeviceFlowStarted,
  type DeviceFlow,
} from "../analytics/device-events";

/** Best-effort device model id for analytics; never throws. */
async function analyticsDeviceModelId(): Promise<string | undefined> {
  try {
    return await getWalletCliDeviceModelId();
  } catch {
    return undefined;
  }
}

export function withLedgerManagerAppSession<T>(
  managerAppName: string,
  fn: () => Promise<T>,
  flow?: DeviceFlow,
): Promise<T> {
  return withWalletCliDeviceInterruptScope(async () => {
    const app = managerAppName.toLowerCase();
    if (flow) {
      trackDeviceFlowStarted(flow);
    }
    walletCliDebug("Ensuring DMK transport…");
    try {
      const transport = await ensureWalletCliDmkTransport();
      if (flow) {
        trackDeviceConnected(flow, await analyticsDeviceModelId());
      }
      walletCliDebug(`Connecting Ledger app (${managerAppName})…`);
      await connectLedgerApp(transport.dmk, transport.sessionId, managerAppName, {
        onStateChange: state => {
          if (flow && state.code === "awaiting_approval" && state.reason === "open_app") {
            trackAppRequested(flow, app);
          }
        },
      });
      if (flow) {
        trackAppOpened(flow, app);
      }
    } catch (e) {
      if (flow) trackDeviceFlowFailed(flow, deviceFlowFailureReason(e));
      throw toWalletCliDeviceError(e, { expectedApp: managerAppName, rejectedContext: "open_app" });
    }
    walletCliDebug("Device session ready.");
    try {
      const result = await fn();
      if (flow) trackDeviceFlowCompleted(flow, await analyticsDeviceModelId());
      return result;
    } catch (e) {
      if (flow) trackDeviceFlowFailed(flow, deviceFlowFailureReason(e));
      throw (
        WalletCliDeviceError.fromKnownDeviceError(e, {
          expectedApp: managerAppName,
          rejectedContext: "sign",
        }) ?? e
      );
    } finally {
      walletCliDebug("Resetting device session…");
      await resetWalletCliDmkSession();
    }
  });
}
