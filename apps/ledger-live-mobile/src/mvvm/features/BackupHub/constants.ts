import type { BackupBucket } from "./types";

export const BACKUP_HUB_TRACKING_PAGE_NAME = "Backup hub";

export const BACKUP_HUB_TRACKING_BUTTON = {
  recover: "Ledger Recover",
  recoveryKey: "Ledger Recovery Key",
  secretRecoveryPhrase: "24-words accessories",
  compare: "Compare all",
} as const;

export const BACKUP_HUB_RECOVER_TRACKING_STATUS: Record<BackupBucket, string> = {
  "not-subscribed": "New",
  "in-progress": "in progress",
  done: "done",
};

export const RECOVER_DEEPLINK_BASE = "ledgerlive://recover";

export const BACKUP_HUB_RECOVER_DEEPLINK_QUERY = {
  inProgress:
    "redirectTo=resumeActivate&source=llm-entry-point-backup-up&ajs_recover_source=llm-entry-point-backup-up&ajs_recover_campaign=native-llm-ongoing-subscription",
  done: "source=llm-entry-point-backup-up&ajs_prop_source=llm-entry-point-backup-up&ajs_prop_campaign=native-llm-subscribed",
} as const;
