import { getEnv } from "@ledgerhq/live-env";
import { WalletSyncEnvironment } from "@ledgerhq/types-live";

type EnvironmentParams = {
  cloudSyncApiBaseUrl: string;
  trustchainApiBaseUrl: string;
};

export default function getEnvironmentParams(
  environment: WalletSyncEnvironment | undefined,
): EnvironmentParams {
  return {
    cloudSyncApiBaseUrl:
      environment && environment === "STAGING"
        ? getEnv<string>("CLOUD_SYNC_API_STAGING")
        : getEnv<string>("CLOUD_SYNC_API_PROD"),
    trustchainApiBaseUrl:
      environment && environment === "STAGING"
        ? getEnv<string>("TRUSTCHAIN_API_STAGING")
        : getEnv<string>("TRUSTCHAIN_API_PROD"),
  };
}
