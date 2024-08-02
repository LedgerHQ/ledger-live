import { setEnv } from "@ledgerhq/live-env";
import getEnvironmentParams from "./getEnvironmentParams";

describe("getEnvironmentParams", () => {
  it("Should return production env urls for the PROD environment", async () => {
    setEnv("CLOUD_SYNC_API_PROD", "cloud_sync_api_prod_url");
    setEnv("TRUSTCHAIN_API_PROD", "trustchain_api_prod_url");

    const { cloudSyncApiBaseUrl, trustchainApiBaseUrl } = getEnvironmentParams("PROD");
    expect(cloudSyncApiBaseUrl).toBe("cloud_sync_api_prod_url");
    expect(trustchainApiBaseUrl).toBe("trustchain_api_prod_url");
  });

  it("Should return staging env urls for the STAGING environment", async () => {
    setEnv("CLOUD_SYNC_API_STAGING", "cloud_sync_api_staging_url");
    setEnv("TRUSTCHAIN_API_STAGING", "trustchain_api_staging_url");

    const { cloudSyncApiBaseUrl, trustchainApiBaseUrl } = getEnvironmentParams("STAGING");
    expect(cloudSyncApiBaseUrl).toBe("cloud_sync_api_staging_url");
    expect(trustchainApiBaseUrl).toBe("trustchain_api_staging_url");
  });
});
