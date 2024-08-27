import { track } from "~/renderer/analytics/segment";
import { Step } from "~/renderer/reducers/walletSync";

export enum AnalyticsPage {
  ManageBackup = "Manage Backup",
  ConfirmDeleteBackup = "Confirm Delete Backup",
  BackupDeleted = "Backup Deleted",
  BackupDeletionError = "Backup Deletion Error",

  ManageInstances = "Manage synchronized instances",
  DeviceActionInstance = "Device Action Manage Instance",
  DeleteInstanceWithTrustChain = "Delete instance with trustchain",
  InstanceRemovalSuccess = "Instance removal success",
  Unsecured = "Remove instance wrong device connected",
  AutoRemove = "Remove current instance",
  AlreadySecuredSameSeed = "Already secured Ledger with this seed",
  AlreadySecuredOtherSeed = "Already secured Ledger with another seed",

  Activation = "Activate Wallet Sync",
  DeviceActionActivation = "Device Action Activate Wallet Sync",
  CreateOrSynchronizeTrustChain = "Create or synchronize with trustchain",
  SynchronizationError = "Synchronization error",
  SyncMethod = "Choose sync method",
  MobileSync = "Mobile sync",
  DesktopSync = "Desktop sync",
  KeyCreated = "Backup creation success",
  KeyUpdated = "Backup update success",

  SyncWithQR = "Sync with QR code",
  PinCode = "Pin code",
  PinCodeError = "Pin code error",
  UnbackedError = "No trustchain initialized error",

  SettingsGeneral = "Settings General",
  WalletSyncSettings = "Wallet Sync Settings",
}

type Flow = "Wallet Sync";

type OnClickTrack = {
  button: string;
  page: string;
  flow?: Flow;
};

type onActionTrack = {
  button: string;
  step: Step;
  flow: Flow;
};

export const StepMappedToAnalytics: Record<Step, string> = {
  [Step.ManageBackup]: AnalyticsPage.ManageBackup,
  [Step.DeleteBackup]: AnalyticsPage.ConfirmDeleteBackup,
  [Step.BackupDeleted]: AnalyticsPage.BackupDeleted,
  [Step.BackupDeletionError]: AnalyticsPage.BackupDeletionError,

  //Activation
  [Step.CreateOrSynchronize]: AnalyticsPage.Activation,
  [Step.DeviceAction]: AnalyticsPage.DeviceActionActivation,
  [Step.CreateOrSynchronizeTrustChain]: AnalyticsPage.CreateOrSynchronizeTrustChain,
  [Step.ActivationFinal]: AnalyticsPage.KeyCreated,
  [Step.SynchronizationFinal]: AnalyticsPage.KeyUpdated,
  [Step.SynchronizationError]: AnalyticsPage.SynchronizationError,
  [Step.AlreadySecuredSameSeed]: AnalyticsPage.AlreadySecuredSameSeed,
  [Step.AlreadySecuredOtherSeed]: AnalyticsPage.AlreadySecuredOtherSeed,

  //Synchronize
  [Step.SynchronizeMode]: AnalyticsPage.SyncMethod,
  [Step.SynchronizeWithQRCode]: AnalyticsPage.SyncWithQR,
  [Step.PinCode]: AnalyticsPage.PinCode,
  [Step.PinCodeError]: AnalyticsPage.PinCodeError,
  [Step.Synchronized]: AnalyticsPage.KeyUpdated,
  [Step.UnbackedError]: AnalyticsPage.UnbackedError,

  //ManageInstances
  [Step.SynchronizedInstances]: AnalyticsPage.ManageInstances,
  [Step.UnsecuredLedger]: AnalyticsPage.Unsecured,
  [Step.AutoRemoveInstance]: AnalyticsPage.AutoRemove,
  [Step.DeviceActionInstance]: AnalyticsPage.DeviceActionInstance,
  [Step.DeleteInstanceWithTrustChain]: AnalyticsPage.DeleteInstanceWithTrustChain,
  [Step.InstanceSuccesfullyDeleted]: AnalyticsPage.InstanceRemovalSuccess,
  [Step.InstanceErrorDeletion]: AnalyticsPage.ManageInstances,

  //walletSyncActivated
  [Step.WalletSyncActivated]: AnalyticsPage.WalletSyncSettings,
};

export function useWalletSyncAnalytics() {
  const onClickTrack = ({ button, page, flow }: OnClickTrack) => {
    track("button_clicked2", { button, page, flow });
  };

  const onActionTrack = ({ button, step, flow }: onActionTrack) => {
    track("button_clicked2", { button, page: StepMappedToAnalytics[step], flow });
  };

  return { onClickTrack, onActionTrack };
}
