import {
  getWalletSyncEnvironmentParams,
  resolveWalletSyncEnvironment,
} from "../walletSyncEnvironment";
import { setEnv } from "@shared/env";

describe("resolveWalletSyncEnvironment", () => {
  it("should default to PROD when the environment is unset", () => {
    expect(resolveWalletSyncEnvironment(undefined)).toBe("PROD");
  });

  it.each(["PROD", "STAGING"] as const)("should accept %s", environment => {
    expect(resolveWalletSyncEnvironment(environment)).toBe(environment);
  });

  it("should reject an invalid environment", () => {
    expect(() => resolveWalletSyncEnvironment("production")).toThrow(
      "Invalid WALLET_SYNC_ENVIRONMENT: production",
    );
  });
});

describe("getWalletSyncEnvironmentParams", () => {
  beforeAll(() => {
    setEnv("CLOUD_SYNC_API_PROD", "cloud-sync-prod");
    setEnv("TRUSTCHAIN_API_PROD", "trustchain-prod");
    setEnv("CLOUD_SYNC_API_STAGING", "cloud-sync-staging");
    setEnv("TRUSTCHAIN_API_STAGING", "trustchain-staging");
  });

  it.each(["PROD", "STAGING"] as const)("should return paired URLs for %s", environment => {
    const suffix = environment.toLowerCase();
    expect(getWalletSyncEnvironmentParams(environment)).toEqual({
      cloudSyncApiBaseUrl: `cloud-sync-${suffix}`,
      trustchainApiBaseUrl: `trustchain-${suffix}`,
    });
  });
});
