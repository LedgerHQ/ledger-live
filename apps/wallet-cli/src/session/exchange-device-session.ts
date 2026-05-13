import { connectLedgerApp } from "../device/connect-ledger-app";
import { toWalletCliDeviceError, WalletCliDeviceError } from "../device/wallet-cli-device-error";
import {
  ensureWalletCliDmkTransport,
  resetWalletCliDmkSession,
} from "../device/register-dmk-transport";
import { withWalletCliDeviceInterruptScope } from "../device/interrupt-scope";
import { walletCliDebug } from "../shared/log";

export function withLedgerManagerAppSession<T>(
  managerAppName: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withWalletCliDeviceInterruptScope(async () => {
    walletCliDebug("Ensuring DMK transport…");
    try {
      const transport = await ensureWalletCliDmkTransport();
      walletCliDebug(`Connecting Ledger app (${managerAppName})…`);
      await connectLedgerApp(transport.dmk, transport.sessionId, managerAppName);
    } catch (e) {
      throw toWalletCliDeviceError(e, { expectedApp: managerAppName, rejectedContext: "open_app" });
    }
    walletCliDebug("Device session ready.");
    try {
      return await fn();
    } catch (e) {
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
