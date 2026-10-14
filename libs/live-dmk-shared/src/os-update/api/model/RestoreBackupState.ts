import type { RestoreBackupDAOutput } from "@ledgerhq/dmk-ledger-wallet";

export enum RestoreBackupStateType {
  LOADING = "LOADING",
  RESTORING = "RESTORING",
  DEVICE_LOCKED = "DEVICE_LOCKED",
  AWAITING_ALLOW_SECURE_CONNECTION = "AWAITING_ALLOW_SECURE_CONNECTION",
  ALLOW_SECURE_CONNECTION_REFUSED = "ALLOW_SECURE_CONNECTION_REFUSED",
  AWAITING_GRANT_CONSENT = "AWAITING_GRANT_CONSENT",
  AWAITING_ALLOW_LIST_APPS = "AWAITING_ALLOW_LIST_APPS",
  AWAITING_CONFIRM_LOAD_IMAGE = "AWAITING_CONFIRM_LOAD_IMAGE",
  AWAITING_CONFIRM_COMMIT_IMAGE = "AWAITING_CONFIRM_COMMIT_IMAGE",
  DEVICE_DISCONNECTED = "DEVICE_DISCONNECTED",
  OUT_OF_MEMORY = "OUT_OF_MEMORY",
  BACKUP_RESTORED = "BACKUP_RESTORED",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

export type RestoreBackupState =
  | {
      type: RestoreBackupStateType.LOADING;
    }
  | {
      type: RestoreBackupStateType.RESTORING;
      progress: number;
    }
  | {
      type: RestoreBackupStateType.DEVICE_LOCKED;
    }
  | {
      type: RestoreBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION;
    }
  | {
      type: RestoreBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED;
      retry: () => void;
      cancel: () => void;
    }
  | {
      type: RestoreBackupStateType.AWAITING_GRANT_CONSENT;
    }
  | {
      type: RestoreBackupStateType.AWAITING_ALLOW_LIST_APPS;
    }
  | {
      type: RestoreBackupStateType.AWAITING_CONFIRM_LOAD_IMAGE;
    }
  | {
      type: RestoreBackupStateType.AWAITING_CONFIRM_COMMIT_IMAGE;
    }
  | {
      type: RestoreBackupStateType.DEVICE_DISCONNECTED;
    }
  | {
      type: RestoreBackupStateType.OUT_OF_MEMORY;
      cancel: () => void;
    }
  | {
      type: RestoreBackupStateType.BACKUP_RESTORED;
      restoreResult: RestoreBackupDAOutput | undefined;
    }
  | {
      type: RestoreBackupStateType.UNEXPECTED_ERROR;
      cancel: () => void;
    };
