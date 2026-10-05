export const LKRP_APPLICATION_ID = 17;

export const MEMBER_NAME_MAX_LENGTH = 64;

// Ledger Sync (App-16) stream an enrolled agent is granted access to.
export const LEDGER_SYNC_APPLICATION_ID = 16;

// Trustchain backend per Agent Intent environment: hosts both the enrollment relay and LKRP.
export const AGENT_INTENT_TRUSTCHAIN_URLS = {
  staging: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
  production: "https://trustchain.api.live.ledger.com",
} as const;

// Cloud Sync backend per Agent Intent environment, paired with AGENT_INTENT_TRUSTCHAIN_URLS.
export const CLOUD_SYNC_API_URLS = {
  staging: "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
  production: "https://cloud-sync.api.live.ledger.com",
} as const;
