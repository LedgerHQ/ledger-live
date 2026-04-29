import { connectLedgerApp } from "../device/connect-ledger-app";
import { toWalletCliDeviceError } from "../device/wallet-cli-device-error";
import {
  ensureWalletCliDmkTransport,
  resetWalletCliDmkSession,
} from "../device/register-dmk-transport";
import { walletCliDebug } from "../shared/log";

export async function withLedgerManagerAppSession<T>(
  managerAppName: string,
  fn: () => Promise<T>,
): Promise<T> {
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
