import type { BackupBucket } from "./types";

export const BACKUP_HUB_TRACKING_PAGE_NAME = "Backup hub";

/** Touchscreen Upgrade Program page when the Recovery Key upsell CTA is shown. */
export const BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME = "Backups";

export const BACKUP_HUB_UPSELL_TRACKING_BUTTON = "upgrade";

export const BACKUP_HUB_UPSELL_FALLBACK_LINK =
  "https://shop.ledger.com/pages/ledger-nano-upgrade-program";

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

export const BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK = {
  redirectTo: "resumeActivate",
  source: "llm-bottom-sheet",
  campaign: "llm-bottom-sheet-native",
} as const;
