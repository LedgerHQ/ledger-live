import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol/ApduDevice";
import { connectLedgerApp } from "../device/connect-ledger-app";
import type { DeviceState } from "../device/device-state";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import {
  ensureWalletCliDmkTransport,
  resetWalletCliDmkSession,
} from "../device/register-dmk-transport";
import { walletCliDebug } from "../shared/log";

export type CurrencyDeviceSessionOptions = {
  /** Observer for every intermediate device-state transition during connect/open-app. */
  onStateChange?: (state: DeviceState) => void;
  /** Max time to wait for the device to unlock. Defaults in connect-ledger-app. */
  deviceTimeoutMs?: number;
};

export function getManagerAppNameForCurrencyId(currencyId: string): string {
  return getCryptoCurrencyById(currencyId).managerAppName;
}

export async function withCurrencyDeviceSession<T>(
  currencyId: string,
  fn: () => Promise<T>,
  options: CurrencyDeviceSessionOptions = {},
): Promise<T> {
  const managerAppName = getManagerAppNameForCurrencyId(currencyId);
  walletCliDebug("Ensuring DMK transport…");
  try {
    const transport = await ensureWalletCliDmkTransport();
    walletCliDebug(`Connecting Ledger app (${managerAppName})…`);
    await connectLedgerApp(transport.dmk, transport.sessionId, managerAppName, {
      onStateChange: options.onStateChange,
      deviceTimeoutMs: options.deviceTimeoutMs,
    });
  } catch (e) {
    throw WalletCliDeviceError.fromUnknown(e, { expectedApp: managerAppName });
  }
  walletCliDebug("Device session ready.");
  try {
    return await fn();
  } finally {
    walletCliDebug("Resetting device session…");
    await resetWalletCliDmkSession();
  }
}

/** Open the Ledger Sync app and run a function that sends LKRP APDUs. No currency required. */
export async function withLkrpDeviceSession<T>(fn: () => Promise<T>): Promise<T> {
  walletCliDebug("Ensuring DMK transport for LKRP…");
  try {
    const transport = await ensureWalletCliDmkTransport();
    walletCliDebug("Connecting Ledger Sync app…");
    await connectLedgerApp(transport.dmk, transport.sessionId, TRUSTCHAIN_APP_NAME);
  } catch (e) {
    throw WalletCliDeviceError.fromUnknown(e, { expectedApp: TRUSTCHAIN_APP_NAME });
  }
  walletCliDebug("Ledger Sync app open.");
  try {
    return await fn();
  } finally {
    walletCliDebug("Resetting device session…");
    await resetWalletCliDmkSession();
  }
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

export async function withBridgeDeviceSession<T>(
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
