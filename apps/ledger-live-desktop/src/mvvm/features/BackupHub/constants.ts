export const BACKUP_HUB_TRACKING_PAGE_NAME = "Backup hub";

export const BACKUP_HUB_TRACKING_BUTTON = {
  back: "Back",
  recover: "Ledger Recover",
  recoveryKey: "Recovery Key",
  secretRecoveryPhrase: "Secret Recovery Phrase",
} as const;

export const RECOVER_DEEPLINK_BASE = "ledgerlive://recover";

export const BACKUP_HUB_RECOVER_DEEPLINK_QUERY = {
  inProgress:
    "redirectTo=resumeActivate&source=lld-entry-point-backup-up&ajs_recover_source=lld-entry-point-backup-up&ajs_recover_campaign=native-lld-ongoing-subscription",
  done: "source=lld-entry-point-backup-up&ajs_prop_source=lld-entry-point-backup-up&ajs_prop_campaign=native-lld-subscribed",
} as const;
