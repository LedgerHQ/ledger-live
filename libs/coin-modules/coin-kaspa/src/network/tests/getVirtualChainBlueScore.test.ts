import { getVirtualChainBlueScore } from "../indexer-api/getVirtualChainBlueScore";

describe("getVirtualChainBlueScore Function", () => {
  it("should return blueScore when fetch successfully", async () => {
    const blueScore = await getVirtualChainBlueScore();
    expect(blueScore).toBeGreaterThan(96893225);
  });
});
