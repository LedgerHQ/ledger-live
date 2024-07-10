import { track } from "~/renderer/analytics/segment";

export enum AnalyticsPage {
  ManageBackup = "Manage Backup",
  ConfirmDeleteBackup = "Confirm Delete Backup",
  ManageInstances = "Manage synchronized instances",
}

type OnClickTrack = {
  button: string;
  page: string;
  flow?: string;
};

export function useWalletSyncAnalytics() {
  const onClickTrack = ({ button, page, flow }: OnClickTrack) => {
    track("button_clicked2", { button, page, flow });
  };

  return { onClickTrack };
}
