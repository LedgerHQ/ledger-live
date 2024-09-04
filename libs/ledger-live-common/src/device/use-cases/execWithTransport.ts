import Transport from "@ledgerhq/hw-transport";
import { Exec } from "../../apps";
import installApp from "../../hw/installApp";
import installAppWithRestore from "../../hw/installAppWithRestore";
import uninstallApp from "../../hw/uninstallApp";
import uninstallAppWithBackup from "../../hw/uninstallAppWithBackup";

export const execWithTransport =
  (transport: Transport, appsBackupEnabled: boolean = false): Exec =>
  args => {
    const { appOp, targetId, app, modelId, storage, deleteAppDataBackup } = args;

    // if appsBackupEnabled is true, we will use the backup/restore flow
    // modelId & storage are required for the new flow, but can still be
    // undefined for the old flow, so we need to check if they are defined
    if (appsBackupEnabled && modelId && storage) {
      const fn = appOp.type === "install" ? installAppWithRestore : uninstallAppWithBackup;
      return fn(transport, targetId, app, modelId, storage, deleteAppDataBackup);
    }

    const fn = appOp.type === "install" ? installApp : uninstallApp;
    return fn(transport, targetId, app);
  };
