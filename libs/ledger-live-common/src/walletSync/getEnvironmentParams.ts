import { getEnv } from "@shared/env";
import { WalletSyncEnvironment } from "@ledgerhq/types-live";

type EnvironmentParams = {
  cloudSyncApiBaseUrl: string;
  trustchainApiBaseUrl: string;
};

/** @deprecated The apps take the Ledger Sync URLs from the `ledgerKeyRing` app config switch. */
export default function getEnvironmentParams(
  environment: WalletSyncEnvironment | undefined,
): EnvironmentParams {
  return {
    cloudSyncApiBaseUrl:
      environment && environment === "STAGING"
        ? getEnv("CLOUD_SYNC_API_STAGING")
        : getEnv("CLOUD_SYNC_API_PROD"),
    trustchainApiBaseUrl:
      environment && environment === "STAGING"
        ? getEnv("TRUSTCHAIN_API_STAGING")
        : getEnv("TRUSTCHAIN_API_PROD"),
  };
}
