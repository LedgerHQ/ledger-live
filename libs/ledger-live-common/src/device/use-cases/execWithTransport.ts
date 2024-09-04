import Transport from "@ledgerhq/hw-transport";
import { Exec } from "../../apps";
import installApp from "../../hw/installApp";
import installAppWithRestore from "../../hw/installAppWithRestore";
import uninstallApp from "../../hw/uninstallApp";
import uninstallAppWithBackup from "../../hw/uninstallAppWithBackup";

/**
 * ExecWithTransport
 * @param transport - The transport object used to communicate with the Ledger device.
 * @param appsBackupEnabled - Whether apps backup is enabled (feature flagged)
 * @returns An observable that emits the progress of the execution.
 */
export const execWithTransport =
  (transport: Transport, appsBackupEnabled: boolean = false): Exec =>
  args => {
    const { appOp, targetId, app, modelId, storage, skipAppDataBackup } = args;

    // if appsBackupEnabled is true, we will use the data backup/restore flow
    // modelId & storage are required for the new flow, but can still be
    // undefined for the old flow, so we need to check if they are defined
    if (appsBackupEnabled && modelId && storage) {
      const fn = appOp.type === "install" ? installAppWithRestore : uninstallAppWithBackup;
      return fn(transport, targetId, app, modelId, storage, skipAppDataBackup);
    }

    const fn = appOp.type === "install" ? installApp : uninstallApp;
    return fn(transport, targetId, app);
  };
