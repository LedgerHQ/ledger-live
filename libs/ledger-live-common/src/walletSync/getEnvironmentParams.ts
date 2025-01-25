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
      environment && environment === "PROD"
        ? getEnv("CLOUD_SYNC_API_PROD")
        : getEnv("CLOUD_SYNC_API_STAGING"),
    trustchainApiBaseUrl:
      environment && environment === "PROD"
        ? getEnv("TRUSTCHAIN_API_PROD")
        : getEnv("TRUSTCHAIN_API_STAGING"),
  };
}
