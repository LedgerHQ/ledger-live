import { ScreenName } from "~/const";

export type BackupBucket = "not-subscribed" | "in-progress" | "done";

export type PhysicalRowId = "recovery-key" | "secret-recovery-phrase";

export type BackupHubNavigatorParamList = {
  [ScreenName.BackupHub]: undefined;
};
