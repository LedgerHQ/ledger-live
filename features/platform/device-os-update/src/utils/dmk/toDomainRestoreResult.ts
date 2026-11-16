import {
  RestoreBackupStatus as DmkRestoreStatus,
  type RestoreBackupDAOutput as DmkRestoreResult,
} from "@ledgerhq/dmk-ledger-wallet";
import { RestoreStatus, type RestoreResult } from "@domain/entity-device-os-update";

function toDomainRestoreStatus(status: DmkRestoreStatus): RestoreStatus {
  switch (status) {
    case DmkRestoreStatus.FULL:
      return RestoreStatus.full;
    case DmkRestoreStatus.PARTIAL:
      return RestoreStatus.partial;
    case DmkRestoreStatus.OUT_OF_MEMORY:
      return RestoreStatus.outOfMemory;
    default: {
      const unhandled: never = status;
      return unhandled;
    }
  }
}

/** What the DMK restored, as the restore and update steps report it. */
export function toDomainRestoreResult(result: DmkRestoreResult): RestoreResult {
  return {
    restoreStatus: toDomainRestoreStatus(result.restoreStatus),
    restoredLanguage: result.restoredLanguage,
    restoredCLS: result.restoredCLS,
    restoredApps: result.restoredApps?.map(({ appName, restoredApp, restoredAppStorage }) => ({
      appName,
      restoredApp,
      restoredAppStorage,
    })),
  };
}
