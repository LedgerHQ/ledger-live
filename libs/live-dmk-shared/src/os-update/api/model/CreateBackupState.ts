export enum CreateBackupStateType {
  LOADING = "LOADING",
  AWAITING_BACKUP_SELECTION = "AWAITING_BACKUP_SELECTION",
  DEVICE_LOCKED = "DEVICE_LOCKED",
  AWAITING_ALLOW_SECURE_CONNECTION = "AWAITING_ALLOW_SECURE_CONNECTION",
  ALLOW_SECURE_CONNECTION_REFUSED = "ALLOW_SECURE_CONNECTION_REFUSED",
  DEVICE_DISCONNECTED = "DEVICE_DISCONNECTED",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

export type CreateBackupState =
  | {
      type: CreateBackupStateType.LOADING;
    }
  | {
      type: CreateBackupStateType.AWAITING_BACKUP_SELECTION;
      useExistingBackup: () => void;
      createNewBackup: () => void;
    }
  | {
      type: CreateBackupStateType.DEVICE_LOCKED;
    }
  | {
      type: CreateBackupStateType.AWAITING_ALLOW_SECURE_CONNECTION;
    }
  | {
      type: CreateBackupStateType.ALLOW_SECURE_CONNECTION_REFUSED;
      retry: () => void;
      cancel: () => void;
    }
  | {
      type: CreateBackupStateType.DEVICE_DISCONNECTED;
    }
  | {
      type: CreateBackupStateType.UNEXPECTED_ERROR;
      cancel: () => void;
    };
