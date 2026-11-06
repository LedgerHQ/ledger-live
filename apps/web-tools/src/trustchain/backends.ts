/** The Ledger Sync backends the trustchain tools reach: a Trustchain and its Cloud Sync. */
export const LEDGER_SYNC_BACKENDS = {
  prod: {
    trustchainApiBaseUrl: "https://trustchain.api.live.ledger.com",
    cloudSyncApiBaseUrl: "https://cloud-sync.api.live.ledger.com",
  },
  staging: {
    trustchainApiBaseUrl: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
    cloudSyncApiBaseUrl: "https://cloud-sync-backend.api.aws.stg.ldg-tech.com",
  },
};
