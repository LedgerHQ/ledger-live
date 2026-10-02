import type { RestoreBackupDAOutput } from "@ledgerhq/dmk-ledger-wallet";

export enum ApplyUpdatesStateType {
  LOADING = "LOADING",
  UPDATING = "UPDATING",
  RESTORING = "RESTORING",
  DEVICE_LOCKED = "DEVICE_LOCKED",
  AWAITING_UPDATE_COMPLETE = "AWAITING_UPDATE_COMPLETE",
  AWAITING_ALLOW_SECURE_CONNECTION = "AWAITING_ALLOW_SECURE_CONNECTION",
  ALLOW_SECURE_CONNECTION_REFUSED = "ALLOW_SECURE_CONNECTION_REFUSED",
  AWAITING_ALLOW_INSTALL_FIRMWARE = "AWAITING_ALLOW_INSTALL_FIRMWARE",
  ALLOW_INSTALL_FIRMWARE_REFUSED = "ALLOW_INSTALL_FIRMWARE_REFUSED",
  AWAITING_GRANT_CONSENT = "AWAITING_GRANT_CONSENT",
  AWAITING_ALLOW_LIST_APPS = "AWAITING_ALLOW_LIST_APPS",
  AWAITING_CONFIRM_LOAD_IMAGE = "AWAITING_CONFIRM_LOAD_IMAGE",
  AWAITING_CONFIRM_COMMIT_IMAGE = "AWAITING_CONFIRM_COMMIT_IMAGE",
  DEVICE_DISCONNECTED = "DEVICE_DISCONNECTED",
  OUT_OF_MEMORY = "OUT_OF_MEMORY",
  UPDATES_APPLIED = "UPDATES_APPLIED",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

export type ApplyUpdatesState =
  | {
      type: ApplyUpdatesStateType.LOADING;
    }
  | {
      type: ApplyUpdatesStateType.UPDATING;
      progress: number;
      updateIndex: number;
      updateCount: number;
    }
  | {
      type: ApplyUpdatesStateType.RESTORING;
      progress: number;
    }
  | {
      type: ApplyUpdatesStateType.DEVICE_LOCKED;
    }
  | {
      type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE;
    }
  | {
      type: ApplyUpdatesStateType.AWAITING_ALLOW_SECURE_CONNECTION;
    }
  | {
      type: ApplyUpdatesStateType.ALLOW_SECURE_CONNECTION_REFUSED;
      retry: () => void;
      cancel: () => void;
    }
  | {
      type: ApplyUpdatesStateType.AWAITING_ALLOW_INSTALL_FIRMWARE;
    }
  | {
      type: ApplyUpdatesStateType.ALLOW_INSTALL_FIRMWARE_REFUSED;
      cancel: () => void;
    }
  | {
      type: ApplyUpdatesStateType.AWAITING_GRANT_CONSENT;
    }
  | {
      type: ApplyUpdatesStateType.AWAITING_ALLOW_LIST_APPS;
    }
  | {
      type: ApplyUpdatesStateType.AWAITING_CONFIRM_LOAD_IMAGE;
    }
  | {
      type: ApplyUpdatesStateType.AWAITING_CONFIRM_COMMIT_IMAGE;
    }
  | {
      type: ApplyUpdatesStateType.DEVICE_DISCONNECTED;
    }
  | {
      type: ApplyUpdatesStateType.OUT_OF_MEMORY;
      cancel: () => void;
    }
  | {
      type: ApplyUpdatesStateType.UPDATES_APPLIED;
      restoreResult: RestoreBackupDAOutput | undefined;
    }
  | {
      type: ApplyUpdatesStateType.UNEXPECTED_ERROR;
      cancel: () => void;
    };
