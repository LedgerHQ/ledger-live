export const LKRP_APPLICATION_ID = 17;

/** Ledger Sync's own LKRP application id — distinct from wallet-cli's `ring` (17) so
 * the two never share a trustchain application, per docs/ledger-sync/02-trustchain-sdk.md. */
export const LEDGER_SYNC_APPLICATION_ID = 16;

export const MEMBER_NAME_MAX_LENGTH = 64;

/** Shared by `lkrp-sdk.ts` and `ledger-sync/cloud-sync-accounts.ts` so the LKRP/Trustchain backend
 * and the Cloud Sync backend always agree on the same environment union — one name, one place. */
export const LEDGER_SYNC_ENVIRONMENTS = ["staging", "production"] as const;
export type LedgerSyncEnvironment = (typeof LEDGER_SYNC_ENVIRONMENTS)[number];

// Public backend hosts per environment, kept inline because `@shared/env` is deprecated (see
// docs/configuration.md). Same values as its TRUSTCHAIN_API_* / CLOUD_SYNC_API_* defaults.
export const TRUSTCHAIN_API_URLS: Record<LedgerSyncEnvironment, string> = {
  staging: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
  production: "https://trustchain.api.live.ledger.com",
};

export const CLOUD_SYNC_API_URLS: Record<LedgerSyncEnvironment, string> = {
  staging: "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
  production: "https://cloud-sync.api.live.ledger.com",
};
