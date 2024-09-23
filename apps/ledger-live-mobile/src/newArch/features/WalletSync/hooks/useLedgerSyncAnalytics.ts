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
  ScannedInvalidQrCode = "Scanned invalid QR code",
  ScannedIncompatibleApps = "Scans incompatible apps",
  Loading = "Loading",
  SettingsGeneral = "Settings General",
  LedgerSyncSettings = "Ledger Sync Settings",
  ManageSyncInstances = "Manage synchronized instances",
  RemoveInstanceWrongDevice = "Remove instance wrong device connected",
  RemoveInstanceSuccess = "Instance removal success",
  ManageBackup = "Delete sync",
  ConfirmDeleteBackup = "Confirm delete sync",
  DeleteBackupSuccess = "Delete sync success",
  SyncWithNoKey = "Scan attempt with no sync",
  LedgerSyncActivated = "Ledger Sync activated",
  AutoRemove = "Can’t remove current instance",
  OtherSeed = "You can’t use this Ledger to Sync",
  SameSeed = "App already secured with this Ledger",
  ScanAttemptWithSameBackup = "Scan attempt with same sync",
  ScanAttemptWithDifferentBackups = "Scan attempt with different syncs",
  OnBoardingQRCodeNoBackup = "Onboarding no sync detected with scan",
  OnBoardingDeviceNoBackup = "Onboarding no sync detected with device",
  OnboardingAccessExistingWallet = "Onboarding access existing wallet",
}

export enum AnalyticsFlow {
  LedgerSync = "Ledger Sync",
}

export enum AnalyticsButton {
  SyncYourAccounts = "Turn on Ledger Sync",
  AlreadyCreatedKey = "I already turned it on",
  Close = "Close",
  LearnMore = "How does Ledger Sync work",
  UseYourLedger = "Use your Ledger",
  ScanQRCode = "Scan a QR code",
  UseLedgerSync = "Use Ledger Sync",
  SyncWithAnotherLedgerLive = "Sync with another Ledger Live app",
  ShowQRCode = "Show QR",
  TryAgain = "Try again",
  Synchronize = "Synchronize",
  ManageKey = "Manage key",
  ManageInstances = "Manage instances",
  RemoveInstance = "Remove instance",
  ConnectAnotherLedger = "Connect another Ledger",
  DeleteKey = "Delete sync",
  Delete = "Yes Delete",
  Cancel = "Cancel",
  Keep = "Keep",
  LedgerSync = "Ledger Sync",
  UseAnother = "Connect another ledger",
  Understand = "I understand",
  TryAnotherLedger = "Try another Ledger",
  ContinueWihtoutSync = "Continue without sync",
  CheckoutArticle = "Check out this article",
}

type OnClickTrack = {
  button: (typeof AnalyticsButton)[keyof typeof AnalyticsButton];
  page: (typeof AnalyticsPage)[keyof typeof AnalyticsPage];
  hasFlow?: boolean;
};

export function useLedgerSyncAnalytics() {
  const onClickTrack = ({ button, page, hasFlow = false }: OnClickTrack) => {
    track("button_clicked", { button, page, flow: hasFlow ? AnalyticsFlow.LedgerSync : undefined });
  };

  return { onClickTrack };
}
