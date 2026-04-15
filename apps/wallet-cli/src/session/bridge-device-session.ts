import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { connectLedgerApp } from "../device/connect-ledger-app";
import { toWalletCliDeviceError } from "../device/wallet-cli-device-error";
import {
  ensureWalletCliDmkTransport,
  resetWalletCliDmkSession,
} from "../device/register-dmk-transport";
import { walletCliDebug } from "../shared/log";

export async function withCurrencyDeviceSession<T>(
  currencyId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const { managerAppName } = getCryptoCurrencyById(currencyId);
  walletCliDebug("Ensuring DMK transport…");
  try {
    const transport = await ensureWalletCliDmkTransport();
    walletCliDebug(`Connecting Ledger app (${managerAppName})…`);
    await connectLedgerApp(transport.dmk, transport.sessionId, managerAppName);
    walletCliDebug("Device session ready.");
    try {
      return await fn();
    } finally {
      walletCliDebug("Resetting device session…");
      await resetWalletCliDmkSession();
    }
  } catch (e) {
    throw toWalletCliDeviceError(e);
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

export async function withBridgeDeviceSession<T>(family: string, fn: () => Promise<T>): Promise<T> {
  const currencyId = FAMILY_CURRENCY_ID[family];
  if (!currencyId) {
    throw new Error(`No canonical currency for family "${family}".`);
  }
  return withCurrencyDeviceSession(currencyId, fn);
}
