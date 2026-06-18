export const BACKUP_HUB_TRACKING_PAGE_NAME = "Backup Hub";

export const BACKUP_HUB_TRACKING_BUTTON = {
  recover: "Ledger Recover",
  recoveryKey: "Recovery Key",
  secretRecoveryPhrase: "Secret Recovery Phrase",
  compare: "Compare backup methods",
} as const;

export const RECOVER_DEEPLINK_BASE = "ledgerlive://recover";

export const BACKUP_HUB_RECOVER_DEEPLINK_QUERY = {
  inProgress:
    "redirectTo=resumeActivate&source=llm-entry-point-backup-up&ajs_recover_source=llm-entry-point-backup-up&ajs_recover_campaign=native-llm-ongoing-subscription",
  done: "source=llm-entry-point-backup-up&ajs_prop_source=llm-entry-point-backup-up&ajs_prop_campaign=native-llm-subscribed",
} as const;
