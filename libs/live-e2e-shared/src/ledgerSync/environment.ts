import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

export type LedgerSyncEnvironment = "STAGING" | "PROD";

export const ledgerSyncEnvironment: LedgerSyncEnvironment =
  process.env.LEDGER_SYNC_ENVIRONMENT === "PROD" ? "PROD" : "STAGING";

/**
 * The app config selection the app boots on, so that it runs on the backends of the e2e CLI. The
 * `ledgerKeyRing` switch moves the app's Trustchain, Cloud Sync and Keycloak URLs together.
 */
export const ledgerSyncAppConfig = {
  ledgerKeyRing: ledgerSyncEnvironment === "PROD" ? "prod" : "staging",
} as const;

/**
 * Both URLs come from a single resolution, the same way the app's `ledgerKeyRing` options pair
 * them. They must stay paired: the trustchain mints the JWT that cloud-sync then validates, so a
 * trustchain and a cloud-sync from different environments produce a token the other rejects —
 * surfacing only as `400 Invalid value for: header Authorization`.
 */
export const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } =
  getWalletSyncEnvironmentParams(ledgerSyncEnvironment);

// Which backend the run targets is the first thing to check when a Ledger Sync test misbehaves.
console.log(
  `[E2E] Ledger Sync environment: ${ledgerSyncEnvironment} (trustchain: ${trustchainApiBaseUrl}, cloud-sync: ${cloudSyncApiBaseUrl})`,
);
