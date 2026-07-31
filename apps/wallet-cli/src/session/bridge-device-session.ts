import type { ApplicationDependency } from "@ledgerhq/device-management-kit";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
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

export type CurrencyDeviceSessionOptions = {
  /** Observer for every intermediate device-state transition during connect/open-app. */
  onStateChange?: (state: DeviceState) => void;
  /** Max time to wait for the device to unlock. Defaults in connect-ledger-app. */
  deviceTimeoutMs?: number;
  /**
   * Extra apps ConnectApp must ensure are installed alongside the currency's app before opening it.
   * Used for clear-signing plugins the main app calls into — e.g. `[{ name: "Kiln" }]` for EVM earn
   * vaults, so the Ethereum app can clear-sign the vault calldata. Defaults to none.
   */
  dependencies?: ApplicationDependency[];
};

export function getManagerAppNameForCurrencyId(currencyId: string): string {
  return getCryptoCurrencyById(currencyId).managerAppName;
}

export function withCurrencyDeviceSession<T>(
  currencyId: string,
  fn: () => Promise<T>,
  options: CurrencyDeviceSessionOptions = {},
): Promise<T> {
  return withWalletCliDeviceInterruptScope(async () => {
    const managerAppName = getManagerAppNameForCurrencyId(currencyId);
    try {
      walletCliDebug("Ensuring DMK transport…");
      try {
        const transport = await ensureWalletCliDmkTransport();
        walletCliDebug(`Connecting Ledger app (${managerAppName})…`);
        await connectLedgerApp(transport.dmk, transport.sessionId, managerAppName, {
          onStateChange: options.onStateChange,
          deviceTimeoutMs: options.deviceTimeoutMs,
          dependencies: options.dependencies,
        });
      } catch (e) {
        const deviceModelId = await getWalletCliDeviceModelId().catch(() => undefined);
        throw WalletCliDeviceError.fromUnknown(e, { expectedApp: managerAppName, deviceModelId });
      }
      walletCliDebug("Device session ready.");
      return await fn();
    } finally {
      walletCliDebug("Resetting device session…");
      await resetWalletCliDmkSession();
    }
  });
}

/**
 * Runs a callback with a DMK transport available, without opening or switching Ledger apps.
 */
export function withDmkDeviceSession<T>(fn: () => Promise<T>): Promise<T> {
  return withWalletCliDeviceInterruptScope(async () => {
    try {
      walletCliDebug("Ensuring DMK transport…");
      try {
        await ensureWalletCliDmkTransport();
      } catch (e) {
        throw WalletCliDeviceError.fromUnknown(e, { expectedApp: "Ledger dashboard" });
      }
      walletCliDebug("DMK device session ready.");
      return await fn();
    } finally {
      walletCliDebug("Resetting device session…");
      await resetWalletCliDmkSession();
    }
  });
}

/** Open the Ledger Sync app and run a function that sends LKRP APDUs. No currency required. */
export function withLkrpDeviceSession<T>(fn: () => Promise<T>): Promise<T> {
  return withWalletCliDeviceInterruptScope(async () => {
    walletCliDebug("Ensuring DMK transport for LKRP…");
    try {
      try {
        const transport = await ensureWalletCliDmkTransport();
        walletCliDebug("Connecting Ledger Sync app…");
        await connectLedgerApp(transport.dmk, transport.sessionId, TRUSTCHAIN_APP_NAME);
      } catch (e) {
        throw WalletCliDeviceError.fromUnknown(e, { expectedApp: TRUSTCHAIN_APP_NAME });
      }
      walletCliDebug("Ledger Sync app open.");
      return await fn();
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
