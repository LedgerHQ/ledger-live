import { track } from "~/renderer/analytics/segment";
import { Step } from "~/renderer/reducers/walletSync";

export enum AnalyticsPage {
  ConfirmDeleteBackup = "Confirm delete sync",
  BackupDeleted = "delete sync success",
  BackupDeletionError = "Sync Deletion Error",

  ManageInstances = "Manage synchronized instances",
  DeviceActionInstance = "Device Action Manage Instance",
  DeleteInstanceWithTrustChain = "Delete instance with trustchain",
  InstanceRemovalSuccess = "Instance removal success",
  Unsecured = "Remove instance wrong device connected",
  AutoRemove = "Remove current instance",
  AlreadySecuredSameSeed = "App already secured with this Ledger",
  AlreadySecuredOtherSeed = "You can’t use this Ledger to Sync",

  Activation = "Activate Ledger Sync",
  DeviceActionActivation = "Device Action Activate Ledger Sync",
  CreateOrSynchronizeTrustChain = "Create or synchronize with trustchain",
  SynchronizationError = "Synchronization error",
  SyncMethod = "Choose sync method",
  MobileSync = "Sync from a mobile",
  DesktopSync = "Sync from a desktop",
  KeyCreated = "Ledger Sync turned on",
  KeyUpdated = "Sync apps success",
  Loading = "Loading Sync",

  SyncWithQR = "Sync with QR code",
  PinCode = "Pin code",
  PinCodeError = "Pin code error",
  UnbackedError = "Scan attempt with no sync",

  SettingsGeneral = "Settings General",
  LedgerSyncSettings = "Ledger Sync Settings",
}

export type AnalyticsFlow = "Ledger Sync";
export const AnalyticsFlow = "Ledger Sync";

type OnClickTrack = {
  button: string;
  page: string;
  flow?: AnalyticsFlow;
};

type onActionTrack = {
  button: string;
  step: Step;
  flow?: AnalyticsFlow;
};

export const StepMappedToAnalytics: Record<Step, string> = {
  [Step.DeleteBackup]: AnalyticsPage.ConfirmDeleteBackup,
  [Step.BackupDeleted]: AnalyticsPage.BackupDeleted,
  [Step.BackupDeletionError]: AnalyticsPage.BackupDeletionError,

  //Activation
  [Step.CreateOrSynchronize]: AnalyticsPage.Activation,
  [Step.DeviceAction]: AnalyticsPage.DeviceActionActivation,
  [Step.CreateOrSynchronizeTrustChain]: AnalyticsPage.CreateOrSynchronizeTrustChain,
  [Step.ActivationLoading]: AnalyticsPage.Loading,
  [Step.ActivationFinal]: AnalyticsPage.KeyCreated,
  [Step.SynchronizationFinal]: AnalyticsPage.KeyUpdated,
  [Step.SynchronizationError]: AnalyticsPage.SynchronizationError,
  [Step.AlreadySecuredSameSeed]: AnalyticsPage.AlreadySecuredSameSeed,
  [Step.AlreadySecuredOtherSeed]: AnalyticsPage.AlreadySecuredOtherSeed,

  //Synchronize
  [Step.SynchronizeMode]: AnalyticsPage.SyncMethod,
  [Step.SynchronizeWithQRCode]: AnalyticsPage.SyncWithQR,
  [Step.SynchronizeLoading]: AnalyticsPage.Loading,
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

  //LedgerSyncActivated
  [Step.LedgerSyncActivated]: AnalyticsPage.LedgerSyncSettings,
};

export const StepsOutsideFlow: Step[] = [
  Step.LedgerSyncActivated,
  Step.AutoRemoveInstance,
  Step.UnsecuredLedger,
  Step.BackupDeletionError,
  Step.SynchronizedInstances,
];

export function useLedgerSyncAnalytics() {
  const onClickTrack = ({ button, page, flow }: OnClickTrack) => {
    track("button_clicked2", { button, page, flow });
  };

  const onActionTrack = ({ button, step, flow }: onActionTrack) => {
    track("button_clicked2", { button, page: StepMappedToAnalytics[step], flow });
  };

  return { onClickTrack, onActionTrack };
}
