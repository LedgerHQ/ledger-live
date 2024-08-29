import { track } from "~/analytics";

export enum AnalyticsPage {
  ActivateLedgerSync = "Activate Ledger Sync",
  ChooseSyncMethod = "Choose sync method",
  BackupCreationSuccess = "Backup creation success",
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
  ManageBackup = "Manage backup",
  ConfirmDeleteBackup = "Confirm delete backup",
  SyncWithNoKey = "Sync with no key",
  LedgerSyncActivated = "Ledger Sync activated",
  AutoRemove = "Remove current instance",
  Unbacked = "Unbacked",
  OtherSeed = "Other seed",
  SameSeed = "Same seed",
  ScanAttemptWithSameBackup = "Scan attempt with same backup",
  ScanAttemptWithDifferentBackups = "Scan attempt with different backups",
}

export enum AnalyticsFlow {
  LedgerSync = "Ledger Sync",
}

export enum AnalyticsButton {
  SyncYourAccounts = "Sync your accounts",
  AlreadyCreatedKey = "Already created key",
  Close = "Close",
  UseYourLedger = "Use your Ledger",
  ScanQRCode = "Scan a QR code",
  SyncWithAnotherLedgerLive = "Sync with another Ledger Live",
  ShowQRCode = "Show QR",
  TryAgain = "Try again",
  Synchronize = "Synchronize",
  ManageKey = "Manage key",
  ManageSynchronizations = "Manage Synchronizations",
  RemoveInstance = "Remove instance",
  ConnectAnotherLedger = "Connect another Ledger",
  DeleteKey = "Delete key",
  Delete = "Delete",
  Cancel = "Cancel",
  CreateYourKey = "Create your key",
  LedgerSync = "Ledger Sync",
  UseAnother = "Connect new ledger",
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
