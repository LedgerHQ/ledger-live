import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import type { DeviceModelId } from "@ledgerhq/devices";

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
  SECURE_CONNECTION_REFUSED = "OS Update - Secure Connection Refused",
  ERROR = "OS Update - Error",
  CLOSE_CONFIRMATION = "OS Update - Close Confirmation",
}

export enum OsUpdateButton {
  BACK = "Back",
  CANCEL = "Cancel",
  CLOSE = "Close",
  CONTINUE = "Continue",
  CREATE_NEW_BACKUP = "Create new backup",
  DELETE_BACKUP = "Delete backup",
  RESTORE = "Restore",
  RETRY = "Retry",
  START = "Start",
  USE_EXISTING_BACKUP = "Use existing backup",
}

export enum OsUpdateMode {
  UPDATE = "update",
  BOOTLOADER_REPAIR = OsUpdateFlowMode.BOOTLOADER_REPAIR,
  RESTORE_BACKUP = OsUpdateFlowMode.RESTORE_BACKUP,
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
  OUT_OF_MEMORY = "OutOfMemory",
  INSTALL_FIRMWARE_REFUSED = "InstallFirmwareRefused",
}

export enum OsUpdateRestoreStatus {
  FULL = "full",
  PARTIAL = "partial",
  NONE = "none",
}

export enum OsUpdatePlatform {
  LWM = "lwm",
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
  | { page: OsUpdatePage.SECURE_CONNECTION_REFUSED; step: OsUpdateFlowStep }
  | { page: OsUpdatePage.CLOSE_CONFIRMATION; step: OsUpdateFlowStep }
  | {
      page: OsUpdatePage.ERROR;
      step: OsUpdateFlowStep;
      failureType: OsUpdateFailureType;
      subError?: string;
    };

export type OsUpdateSharedProperties = {
  platform: OsUpdatePlatform;
  modelId: DeviceModelId;
  transport: OsUpdateTransport;
  mode: OsUpdateMode;
  updateCount?: number;
};
