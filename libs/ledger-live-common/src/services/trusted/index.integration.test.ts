import { computedTokenAddress, getOwnerAddress } from "./solana";

describe("getOwnerAddress", () => {
  it("returns expected ATA info", async () => {
    // When
    const result = await getOwnerAddress(
      "EQ96zptNAWwM23m5v2ByChCMTFu6zUmJgRtUrQV1uYNM",
      "",
      "test",
    );

    // Then
    expect(result).toEqual(
      expect.objectContaining({
        tokenAccount: "EQ96zptNAWwM23m5v2ByChCMTFu6zUmJgRtUrQV1uYNM",
        owner: "AS1kiySqqS6Tvv3KmBsr8Zbg4DUo5fDxDD9v1dF1TVYr",
        contract: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      }),
    );
  });
});

describe("computedTokenAddress", () => {
  it("returns expected ATA info", async () => {
    // When
    const result = await computedTokenAddress(
      "DHTPaexpcpK58w4UpvoLnFH55jfwJdpg4R73mUwryZU8",
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      "",
      "test",
    );

    // Then
    expect(result).toEqual(
      expect.objectContaining({
        tokenAccount: "GizbHjLkKspW5XzkUsWKSoWW3VwBJMYi39NwCmppsbRs",
        owner: "DHTPaexpcpK58w4UpvoLnFH55jfwJdpg4R73mUwryZU8",
        contract: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      }),
    );
  });
});
