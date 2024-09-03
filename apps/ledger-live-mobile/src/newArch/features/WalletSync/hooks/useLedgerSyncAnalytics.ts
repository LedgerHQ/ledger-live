import { track } from "~/analytics";

export enum AnalyticsPage {
  ActivateLedgerSync = "Activate Ledger Sync",
  ChooseSyncMethod = "Choose sync method",
  BackupCreationSuccess = "Backup creation success",
  SyncSuccess = "Sync success",
  ScanQRCode = "Scan QR code",
  ShowQRCode = "Show QR code",
  SyncWithQrCode = "Sync with QR code",
  PinCode = "Pin code",
  PinCodesDoNotMatch = "Pin codes don't match",
  Loading = "Loading",
  SettingsGeneral = "Settings General",
  LedgerSyncSettings = "Ledger Sync Settings",
  ManageSyncInstances = "Manage synchronized instances",
  RemoveInstanceWrongDevice = "Remove instance wrong device connected",
  RemoveInstanceSuccess = "Instance removal success",
  ManageBackup = "Manage key",
  ConfirmDeleteBackup = "Confirm delete backup",
  DeleteBackupSuccess = "Delete key success",
  SyncWithNoKey = "Sync with no key",
  LedgerSyncActivated = "Ledger Sync activated",
  AutoRemove = "Can’t remove current instance",
  OtherSeed = "You can’t use this Ledger to Sync",
  SameSeed = "App already secured with this Ledger",
  ScanAttemptWithSameBackup = "Scan attempt with same backup",
  ScanAttemptWithDifferentBackups = "Scan attempt with different backups",
}

export enum AnalyticsFlow {
  LedgerSync = "Ledger Sync",
}

export enum AnalyticsButton {
  SyncYourAccounts = "Sync your accounts",
  AlreadyCreatedKey = "Already synced a Ledger Live app",
  Close = "Close",
  UseYourLedger = "Use your Ledger",
  ScanQRCode = "Scan a QR code",
  SyncWithAnotherLedgerLive = "Sync with another Ledger Live",
  ShowQRCode = "Show QR",
  TryAgain = "Try again",
  Synchronize = "Synchronize",
  ManageKey = "Manage key",
  ManageInstances = "Manage instances",
  RemoveInstance = "Remove instance",
  ConnectAnotherLedger = "Connect another Ledger",
  DeleteKey = "Delete key",
  Delete = "Delete",
  Cancel = "Cancel",
  CreateYourKey = "Create your key",
  LedgerSync = "Ledger Sync",
  UseAnother = "Connect another ledger",
  Understand = "I understand",
}

type OnClickTrack = {
  button: (typeof AnalyticsButton)[keyof typeof AnalyticsButton];
  page: (typeof AnalyticsPage)[keyof typeof AnalyticsPage];
  flow?: (typeof AnalyticsFlow)[keyof typeof AnalyticsFlow];
};

export function useLedgerSyncAnalytics() {
  const onClickTrack = ({ button, page, flow = AnalyticsFlow.LedgerSync }: OnClickTrack) => {
    track("button_clicked", { button, page, flow });
  };

  return { onClickTrack };
}
