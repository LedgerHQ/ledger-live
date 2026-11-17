export enum OsUpdateEvent {
  STARTED = "osupdate_started",
  COMPLETED = "osupdate_completed",
  FAILED = "osupdate_failed",
  ABORTED = "osupdate_aborted",
}

export enum OsUpdatePage {
  BACKUP_BANNER = "OS Update - Backup Banner",
  RESTORE_CONFIRMATION = "OS Update - Restore Confirmation",
  DELETE_CONFIRMATION = "OS Update - Delete Confirmation",
  BOOTLOADER_DETECTED = "OS Update - Bootloader Detected",
  WHATS_NEW = "OS Update - Whats New",
  PREPARING = "OS Update - Preparing",
  BATTERY_LOW = "OS Update - Battery Low",
  EXISTING_BACKUP = "OS Update - Existing Backup",
  INSTALLING = "OS Update - Installing",
  RESTORING = "OS Update - Restoring",
  SUCCESS = "OS Update - Success",
  CONTINUE_ON_DEVICE = "OS Update - Continue On Device",
  DEVICE_LOCKED = "OS Update - Device Locked",
  DEVICE_DISCONNECTED = "OS Update - Device Disconnected",
  CONNECTION_TIMED_OUT = "OS Update - Connection Timed Out",
  SECURE_CONNECTION_REFUSED = "OS Update - Secure Connection Refused",
  ERROR = "OS Update - Error",
  CLOSE_CONFIRMATION = "OS Update - Close Confirmation",
}

export enum OsUpdateButton {
  BACK = "Back",
  CANCEL = "Cancel",
  CANCEL_OS_UPDATE = "Cancel OS update",
  CANCEL_SECURE_CONNECTION = "Cancel secure connection",
  CLOSE = "Close",
  CONTINUE = "Continue",
  CREATE_NEW_BACKUP = "Create new backup",
  DELETE_BACKUP = "Delete backup",
  FINISH = "Finish",
  LEDGER_SUPPORT = "Ledger support",
  RELEASE_NOTES = "Release notes",
  RESTART_OS_UPDATE = "Restart OS update",
  RESTORE = "Restore",
  RETRY_SECURE_CONNECTION = "Retry secure connection",
  START = "Start",
  USE_EXISTING_BACKUP = "Use existing backup",
}

export enum OsUpdateMode {
  UPDATE = "update",
  BOOTLOADER_REPAIR = "bootloaderRepair",
  RESTORE_BACKUP = "restoreBackup",
}

export enum OsUpdateFlowStep {
  PRE_CHECKS = "preChecks",
  CREATE_BACKUP = "createBackup",
  APPLY_UPDATES = "applyUpdates",
  RESTORE_BACKUP = "restoreBackup",
}

export enum OsUpdateDeviceAction {
  ALLOW_SECURE_CONNECTION = "allowSecureConnection",
  ALLOW_INSTALL_FIRMWARE = "allowInstallFirmware",
  GRANT_CONSENT = "grantConsent",
  ALLOW_LIST_APPS = "allowListApps",
  CONFIRM_LOAD_IMAGE = "confirmLoadImage",
  CONFIRM_COMMIT_IMAGE = "confirmCommitImage",
  UPDATE_COMPLETE = "updateComplete",
}

export enum OsUpdateFailureType {
  UNEXPECTED_ERROR = "UnexpectedError",
  INSTALL_FIRMWARE_REFUSED = "InstallFirmwareRefused",
}

export enum OsUpdateRestoreStatus {
  FULL = "full",
  PARTIAL = "partial",
  OUT_OF_MEMORY = "outOfMemory",
  NONE = "none",
}

export enum OsUpdateTransport {
  BLE = "ble",
  USB = "usb",
}

export type OsUpdatePageEvent =
  | { page: OsUpdatePage.WHATS_NEW; osVersionTo: string }
  | { page: OsUpdatePage.PREPARING; step: OsUpdateFlowStep }
  | { page: OsUpdatePage.BATTERY_LOW; batteryLevel: number }
  | { page: OsUpdatePage.EXISTING_BACKUP }
  | {
      page: OsUpdatePage.INSTALLING;
      updateIndex: number;
      updateCount: number;
      osVersionTo?: string;
    }
  | { page: OsUpdatePage.RESTORING }
  | { page: OsUpdatePage.SUCCESS; restoreStatus: OsUpdateRestoreStatus }
  | {
      page: OsUpdatePage.CONTINUE_ON_DEVICE;
      step: OsUpdateFlowStep;
      deviceAction: OsUpdateDeviceAction;
    }
  | { page: OsUpdatePage.DEVICE_LOCKED; step: OsUpdateFlowStep }
  | { page: OsUpdatePage.DEVICE_DISCONNECTED; step: OsUpdateFlowStep }
  | { page: OsUpdatePage.CONNECTION_TIMED_OUT; step: OsUpdateFlowStep }
  | { page: OsUpdatePage.SECURE_CONNECTION_REFUSED; step: OsUpdateFlowStep }
  | { page: OsUpdatePage.CLOSE_CONFIRMATION; step: OsUpdateFlowStep }
  | {
      page: OsUpdatePage.ERROR;
      step: OsUpdateFlowStep;
      failureType: OsUpdateFailureType;
      subError?: string;
    };

export type OsUpdateSharedProperties = {
  /** The app sending the event: `lwm` on Mobile, `lwd` on Desktop. */
  platform: string;
  /** The Ledger Wallet model id, as every other device event sends it. */
  modelId: string;
  transport: OsUpdateTransport;
  mode: OsUpdateMode;
  updateCount?: number;
};
