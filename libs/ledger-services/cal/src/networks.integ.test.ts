import type { ServiceOption } from "./common";
import { getNetworks, NoNetworksFound } from "./networks";

const STAGING_ENV = { env: "test" } satisfies ServiceOption;

describe("getNetworks", () => {
  it("returns all networks information", async () => {
    // When
    const result = await getNetworks(null, STAGING_ENV);

    // Then
    expect(result).toHaveLength(275);
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
