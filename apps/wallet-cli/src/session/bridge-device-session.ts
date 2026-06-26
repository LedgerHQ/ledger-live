import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { connectLedgerApp } from "../device/connect-ledger-app";
import type { DeviceState } from "../device/device-state";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
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

export type CurrencyDeviceSessionOptions = {
  /** Observer for every intermediate device-state transition during connect/open-app. */
  onStateChange?: (state: DeviceState) => void;
  /** Max time to wait for the device to unlock. Defaults in connect-ledger-app. */
  deviceTimeoutMs?: number;
  /** Device analytics flow tag. When set, device lifecycle events are tracked. */
  flow?: DeviceFlow;
};

/** Best-effort device model id for analytics; never throws. */
async function analyticsDeviceModelId(): Promise<string | undefined> {
  try {
    return await getWalletCliDeviceModelId();
  } catch {
    return undefined;
  }
}

export function getManagerAppNameForCurrencyId(currencyId: string): string {
  return getCryptoCurrencyById(currencyId).managerAppName;
}

export function withCurrencyDeviceSession<T>(
  currencyId: string,
  fn: () => Promise<T>,
  options: CurrencyDeviceSessionOptions = {},
): Promise<T> {
  return withWalletCliDeviceInterruptScope(async () => {
    const { flow } = options;
    const managerAppName = getManagerAppNameForCurrencyId(currencyId);
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
          options.onStateChange?.(state);
        },
        deviceTimeoutMs: options.deviceTimeoutMs,
      });
      if (flow) {
        trackAppOpened(flow, app);
      }
    } catch (e) {
      if (flow) {
        trackDeviceFlowFailed(flow, deviceFlowFailureReason(e));
      }
      throw WalletCliDeviceError.fromUnknown(e, { expectedApp: managerAppName });
    }
    walletCliDebug("Device session ready.");
    try {
      const result = await fn();
      if (flow) {
        trackDeviceFlowCompleted(flow, await analyticsDeviceModelId());
      }
      return result;
    } catch (e) {
      if (flow) {
        trackDeviceFlowFailed(flow, deviceFlowFailureReason(e));
      }
      throw e;
    } finally {
      walletCliDebug("Resetting device session…");
      await resetWalletCliDmkSession();
    }
  });
}

/**
 * Runs a callback with a DMK transport available, without opening or switching Ledger apps.
 */
export function withDmkDeviceSession<T>(fn: () => Promise<T>, flow?: DeviceFlow): Promise<T> {
  return withWalletCliDeviceInterruptScope(async () => {
    if (flow) trackDeviceFlowStarted(flow);
    walletCliDebug("Ensuring DMK transport…");
    try {
      await ensureWalletCliDmkTransport();
      if (flow) trackDeviceConnected(flow, await analyticsDeviceModelId());
    } catch (e) {
      if (flow) trackDeviceFlowFailed(flow, deviceFlowFailureReason(e));
      throw WalletCliDeviceError.fromUnknown(e, { expectedApp: "Ledger dashboard" });
    }
    walletCliDebug("DMK device session ready.");
    try {
      const result = await fn();
      if (flow) trackDeviceFlowCompleted(flow, await analyticsDeviceModelId());
      return result;
    } catch (e) {
      if (flow) trackDeviceFlowFailed(flow, deviceFlowFailureReason(e));
      throw e;
    } finally {
      walletCliDebug("Resetting device session…");
      await resetWalletCliDmkSession();
    }
  });
}

/**
 * Legacy helper for commands that still work with a currency family name.
 * Maps family → canonical currency ID, then delegates to withCurrencyDeviceSession.
 */
const FAMILY_CURRENCY_ID: Record<string, string> = {
  bitcoin: "bitcoin",
  evm: "ethereum",
  solana: "solana",
};

export function withBridgeDeviceSession<T>(
  family: string,
  fn: () => Promise<T>,
  options: CurrencyDeviceSessionOptions = {},
): Promise<T> {
  const currencyId = FAMILY_CURRENCY_ID[family];
  if (!currencyId) {
    throw new Error(`No canonical currency for family "${family}".`);
  }
  return withCurrencyDeviceSession(currencyId, fn, options);
}
