import { track } from "~/analytics";

export enum AnalyticsPage {
  ActivateWalletSync = "Activate Wallet Sync",
  ChooseSyncMethod = "Choose sync method",
  BackupCreationSuccess = "Backup creation success",
  ScanQRCode = "Scan QR code",
  SyncWithQrCode = "Sync with QR code",
  PinCode = "Pin code",
  PinCodesDoNotMatch = "Pin codes don't match",
  SettingsGeneral = "Settings General",
  LedgerSyncSettings = "Ledger Sync Settings",
  ManageSyncInstances = "Manage synchronized instances",
  RemoveInstanceWrongDevice = "Remove instance wrong device connected",
  ManageBackup = "Manage backup",
  ConfirmDeleteBackup = "Confirm delete backup",
  SyncWithNoKey = "Sync with no key",
  WalletSyncActivated = "Wallet Sync activated",
  AutoRemove = "Remove current instance",
}

export enum AnalyticsFlow {
  WalletSync = "Wallet Sync",
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

export function useWalletSyncAnalytics() {
  const onClickTrack = ({ button, page, flow }: OnClickTrack) => {
    track("button_clicked", { button, page, flow });
  };

  return { onClickTrack };
}
