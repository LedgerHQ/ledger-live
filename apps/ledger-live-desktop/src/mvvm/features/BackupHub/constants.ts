export const BACKUP_HUB_TRACKING_PAGE_NAME = "Backup hub";

/** Touchscreen Upgrade Program page when the Recovery Key upsell CTA is shown. */
export const BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME = "Backups";

export const BACKUP_HUB_UPSELL_TRACKING_BUTTON = "upgrade";

export const BACKUP_HUB_TRACKING_BUTTON = {
  back: "Back",
  recover: "Ledger Recover",
  recoveryKey: "Recovery Key",
  secretRecoveryPhrase: "Secret Recovery Phrase",
} as const;

export const BACKUP_HUB_UPSELL_FALLBACK_LINK =
  "https://shop.ledger.com/pages/ledger-nano-upgrade-program";

export const RECOVER_DEEPLINK_BASE = "ledgerlive://recover";

export const BACKUP_HUB_RECOVER_DEEPLINK_QUERY = {
  inProgress:
    "redirectTo=resumeActivate&source=lld-entry-point-backup-up&ajs_recover_source=lld-entry-point-backup-up&ajs_recover_campaign=native-lld-ongoing-subscription",
  done: "source=lld-entry-point-backup-up&ajs_prop_source=lld-entry-point-backup-up&ajs_prop_campaign=native-lld-subscribed",
} as const;
