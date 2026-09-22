export const LKRP_APPLICATION_ID = 17;

/** Ledger Sync's own LKRP application id (NTTVS-728) — distinct from wallet-cli's `ring` (17) so
 * the two never share a trustchain application, per docs/ledger-sync/02-trustchain-sdk.md. */
export const LEDGER_SYNC_APPLICATION_ID = 16;

export const MEMBER_NAME_MAX_LENGTH = 64;

// Ledger Sync (App-16) stream an enrolled agent is granted access to.
export const LEDGER_SYNC_APPLICATION_ID = 16;

// Trustchain backend per Agent Intent environment: hosts both the enrollment relay and LKRP.
export const AGENT_INTENT_TRUSTCHAIN_URLS = {
  staging: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
  production: "https://trustchain.api.live.ledger.com",
} as const;
