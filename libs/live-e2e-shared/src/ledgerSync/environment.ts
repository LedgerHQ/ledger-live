import {
  getWalletSyncEnvironmentParams,
  resolveWalletSyncEnvironment,
} from "@features/platform-wallet-sync";

export const ledgerSyncEnvironment = resolveWalletSyncEnvironment(
  process.env.WALLET_SYNC_ENVIRONMENT ?? "STAGING",
);

/**
 * Both URLs come from a single resolution, the same way the app derives them in `useTrustchainSdk`.
 * They must stay paired: the trustchain mints the JWT that cloud-sync then validates, so a
 * trustchain and a cloud-sync from different environments produce a token the other rejects —
 * surfacing only as `400 Invalid value for: header Authorization`.
 */
export const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } =
  getWalletSyncEnvironmentParams(ledgerSyncEnvironment);

// Which backend the run targets is the first thing to check when a Ledger Sync test misbehaves.
console.log(
  `[E2E] Ledger Sync environment: ${ledgerSyncEnvironment} (trustchain: ${trustchainApiBaseUrl}, cloud-sync: ${cloudSyncApiBaseUrl})`,
);
