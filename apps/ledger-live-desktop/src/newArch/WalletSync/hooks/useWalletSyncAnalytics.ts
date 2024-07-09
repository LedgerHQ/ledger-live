import { track } from "~/renderer/analytics/segment";

export enum AnalyticsPage {
  ManageBackup = "Manage Backup",
  ConfirmDeleteBackup = "Confirm Delete Backup",
  ManageInstances = "Manage synchronized instances",
  Activation = "Activate Wallet Sync",
  SyncMethod = "Choose sync method",
  KeyCreated = "Backup creation success",
  KeyUpdated = "Backup update success",
  SyncWithQR = "Sync with QR code",
  PinCode = "Pin code",
  SettingsGeneral = "Settings General",
  WalletSyncSettings = "Wallet Sync Settings",
  InstanceRemovalSuccess = "Instance removal success",
  Unsecured = "Remove instance wrong device connected",
  AutoRemove = "Remove current instance",
}

type Flow = "Wallet Sync";

type OnClickTrack = {
  button: string;
  page: string;
  flow?: Flow;
};

export function useWalletSyncAnalytics() {
  const onClickTrack = ({ button, page, flow }: OnClickTrack) => {
    track("button_clicked2", { button, page, flow });
  };

  return { onClickTrack };
}
