import { STAGING_ENV } from "./common";
import { getNetworks, NoNetworksFound } from "./networks";

describe("getNetworks", () => {
  it("returns all networks information", async () => {
    // Given
    const CAL_STAGING_NETWORKS_MANAGED_NUM = 275;

    // When
    const result = await getNetworks(null, STAGING_ENV);

    // Then
    expect(result).toHaveLength(CAL_STAGING_NETWORKS_MANAGED_NUM);
  });

  it("returns networks information for ethereum blockchain", async () => {
    // When
    const result = await getNetworks("ethereum", STAGING_ENV);

    // Then
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      appName: "Ethereum",
      chainId: 1,
      coin: "ethereum",
      coinType: 60,
      family: "ethereum",
      id: "ethereum",
      name: "Ethereum",
      networkType: "main",
      tokenStandard: "erc20",
    });
  });

  it("returns an error if the id is incorrect", async () => {
    // When
    await expect(getNetworks("WRONG", STAGING_ENV)).rejects.toEqual(new NoNetworksFound());
  });
});
