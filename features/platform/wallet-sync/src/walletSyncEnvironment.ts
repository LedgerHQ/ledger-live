import { z } from "zod";
import { getEnv } from "@shared/env";

export const WalletSyncEnvironmentSchema = z.enum(["STAGING", "PROD"]);

export type WalletSyncEnvironment = z.infer<typeof WalletSyncEnvironmentSchema>;

export type WalletSyncEnvironmentParams = {
  cloudSyncApiBaseUrl: string;
  trustchainApiBaseUrl: string;
};

export function resolveWalletSyncEnvironment(
  environment: string | undefined,
): WalletSyncEnvironment {
  if (environment === undefined) return "PROD";

  const result = WalletSyncEnvironmentSchema.safeParse(environment);
  if (result.success) return result.data;

  throw new Error(`Invalid WALLET_SYNC_ENVIRONMENT: ${environment}`);
}

export function getWalletSyncEnvironmentParams(
  environment: WalletSyncEnvironment | undefined,
): WalletSyncEnvironmentParams {
  return {
    cloudSyncApiBaseUrl:
      environment === "STAGING" ? getEnv("CLOUD_SYNC_API_STAGING") : getEnv("CLOUD_SYNC_API_PROD"),
    trustchainApiBaseUrl:
      environment === "STAGING" ? getEnv("TRUSTCHAIN_API_STAGING") : getEnv("TRUSTCHAIN_API_PROD"),
  };
}
